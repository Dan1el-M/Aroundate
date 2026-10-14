import "reflect-metadata";
import {
  Body,
  Catch,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpCode,
  Inject,
  Module,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { v7 as uuid } from "uuid";
import { z, ZodError } from "zod";
import type { ServerResponse } from "node:http";
import { loadConfig } from "../../../packages/config/index.js";
import {
  searchSchema,
  consentSchema,
  presetSchema,
  profilePatchSchema,
  uuidSchema,
  reportSchema,
  dsrSchema,
} from "../../../packages/contracts/index.js";
import {
  PURPOSES,
  isAllowed,
  recordChoices,
} from "../../../packages/domain/consent.js";
import {
  DiscoveryError,
  discover,
  isOpen,
  sourceEvidence,
} from "../../../packages/application/discovery.js";
import { SandboxCatalog } from "./infrastructure/catalog.js";
import { MemoryStore, Conflict, type Store } from "./application/store.js";
import {
  Authentication,
  RateLimiter,
  correlation,
  header,
  type ApiRequest,
} from "./security.js";
import { paginate } from "../../../packages/security/pagination.js";

const config = loadConfig();
// Phase 1 supports an isolated sandbox. Live startup is deliberately blocked until the
// database/retention/distributed-quota integration gates in docs/implementation.md pass.
if (config.APP_MODE === "live")
  throw new Error(
    "Live mode is not release-ready; complete database and distributed quota gates first",
  );
for (const key of [
  "GOOGLE_ENABLED",
  "INSTAGRAM_ENABLED",
  "TIKTOK_ENABLED",
  "ANALYTICS_ENABLED",
])
  if (process.env[key] === "true")
    throw new Error(
      `${key} cannot be enabled before provider/consent release gates`,
    );
class Services {
  readonly catalog = new SandboxCatalog();
  readonly store: Store = new MemoryStore();
  readonly auth = new Authentication(config);
}
interface ResponseLike {
  setHeader(name: string, value: string): void;
  status(code: number): ResponseLike;
  json(value: unknown): void;
  end(): void;
}
@Catch()
class Problems implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp(),
      request = http.getRequest<ApiRequest>(),
      response = http.getResponse<ResponseLike>();
    const parserStatus =
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error.status === 400 || error.status === 413)
        ? error.status
        : undefined;
    const status =
      error instanceof ZodError
        ? 422
        : error instanceof DiscoveryError
          ? error.status
          : error instanceof Conflict
            ? 409
            : error instanceof HttpException
              ? error.getStatus()
              : (parserStatus ?? 500);
    const detail =
      error instanceof HttpException
        ? String(error.message)
        : error instanceof DiscoveryError
          ? error.code
          : error instanceof Conflict
            ? "idempotency_mismatch"
            : error instanceof ZodError
              ? "Correct the highlighted fields"
              : "request_failed";
    response.setHeader("Content-Type", "application/problem+json");
    response.setHeader("Cache-Control", "no-store");
    if (status === 401) response.setHeader("WWW-Authenticate", "Bearer");
    if (status === 429) response.setHeader("Retry-After", "60");
    response.status(status).json({
      type: `urn:aroundate:problem:${detail}`,
      title:
        status === 422 ? "Validation failed" : "Request could not be completed",
      status,
      detail,
      correlation_id: request.correlationId ?? correlation(undefined),
      ...(error instanceof ZodError
        ? {
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              code: issue.code,
              message: issue.message,
            })),
          }
        : {}),
    });
    if (status === 500)
      console.error(
        JSON.stringify({
          level: "error",
          event: "request_failed",
          correlation_id: request.correlationId,
        }),
      );
  }
}
@Controller("v1")
class ApiController {
  constructor(@Inject(Services) private services: Services) {}
  @Post("searches")
  @HttpCode(200)
  search(@Body() body: unknown) {
    return discover(
      this.services.catalog,
      searchSchema.parse(body),
      config.secret,
    );
  }
  @Get("taxonomies")
  async taxonomies(
    @Req() request: ApiRequest,
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    z.strictObject({ locale: z.enum(["es-CR", "en"]).optional() }).parse(
      request.query,
    );
    response.setHeader("ETag", '"sandbox-taxonomy-v1"');
    response.setHeader("Cache-Control", "public, max-age=60");
    if (header(request, "if-none-match") === '"sandbox-taxonomy-v1"') {
      response.status(304);
      response.end();
      return;
    }
    return {
      ...(await this.services.catalog.taxonomies()),
      default_radius_km: 5,
      max_radius_km: 50,
      currencies: ["CRC", "USD"],
    };
  }
  @Get("providers/status")
  providerStatus() {
    return {
      providers: ["google", "instagram", "tiktok"].map((provider) => ({
        provider,
        state: "disabled",
        checked_at: null,
      })),
    };
  }
  @Get("places/:place_id")
  async place(@Param("place_id") id: string) {
    uuidSchema.parse(id);
    const place = await this.services.catalog.byId(id);
    if (!place) throw new HttpException("not_found", 404);
    return {
      ...place,
      open_now: isOpen(place, new Date()),
      source_links: [],
      provenance: [sourceEvidence(new Date())],
      opinions: [],
      media: [],
      demo: true,
    };
  }
  @Post("autocomplete")
  @HttpCode(200)
  async autocomplete(@Body() body: unknown) {
    const input = z
      .strictObject({
        q: z.string().min(2).max(200),
        locale: z.enum(["es-CR", "en"]).optional(),
        limit: z.number().int().min(1).max(10).optional(),
      })
      .parse(body);
    const result = await discover(
      this.services.catalog,
      searchSchema.parse({
        q: input.q,
        center: { kind: "city", city_id: "san-jose" },
        filters: { radius_km: 50 },
      }),
      config.secret,
    );
    return {
      items: result.items.slice(0, input.limit ?? 5).map((place) => ({
        label: place.name,
        kind: "place",
        reference: place.id,
        source: "aroundate",
      })),
      warnings: result.warnings,
    };
  }
  @Post("geocoding")
  @HttpCode(200)
  geocode(@Body() body: unknown) {
    z.strictObject({
      address: z.string().min(1).max(300),
      country: z.string().regex(/^[A-Z]{2}$/),
      locale: z.enum(["es-CR", "en"]).optional(),
    }).parse(body);
    throw new HttpException("geocoding_disabled_use_city_or_coordinates", 503);
  }
  @Get("consents")
  async consentState(@Req() request: ApiRequest) {
    const proof = await this.services.auth.proof(request),
      events = await this.services.store.consents(proof);
    const context = {
      version: "2026-10-14",
      now: Date.now(),
      maxAgeMs: 180 * 86400000,
      gpc: header(request, "sec-gpc") === "1",
      dnt: header(request, "dnt") === "1",
    };
    return {
      policy_version: context.version,
      choices: PURPOSES.map((purpose) => ({
        purpose,
        allowed: isAllowed(purpose, events, context),
      })),
      gpc: context.gpc,
      dnt: context.dnt,
      expires_at: new Date(context.now + context.maxAgeMs).toISOString(),
      has_choice: events.length > 0,
    };
  }
  @Post("consents")
  @HttpCode(200)
  async consent(@Req() request: ApiRequest, @Body() body: unknown) {
    const input = consentSchema.parse(body),
      proof = await this.services.auth.proof(request);
    return this.write(request, proof, async () => {
      const events = recordChoices(
        [],
        input.choices,
        input.policy_version,
        Date.now(),
      );
      await this.services.store.appendConsent(proof, events);
      return this.consentState(request);
    });
  }
  @Get("me")
  async profile(
    @Req() request: ApiRequest,
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    const principal = await this.services.auth.principal(
        request,
        "profile:read",
      ),
      profile = (await this.services.store.user(principal)).profile;
    response.setHeader("ETag", `"${profile.version}"`);
    return { ...profile, email: null };
  }
  @Patch("me")
  async updateProfile(@Req() request: ApiRequest, @Body() body: unknown) {
    const input = profilePatchSchema.parse(body),
      principal = await this.services.auth.principal(request, "profile:write");
    return this.services.store.idempotent(
      `${principal.issuer}:${principal.subject}`,
      request.path,
      uuid(),
      JSON.stringify(body),
      async () => {
        if (!header(request, "if-match"))
          throw new HttpException("precondition_required", 428);
        const data = await this.services.store.user(principal);
        if (header(request, "if-match") !== `"${data.profile.version}"`)
          throw new HttpException("stale_version", 412);
        if (input.display_name !== undefined)
          data.profile.display_name = input.display_name;
        if (input.locale !== undefined) data.profile.locale = input.locale;
        data.profile.version++;
        await this.services.store.saveUser(principal, data);
        return data.profile;
      },
    );
  }
  @Get("me/saved-places")
  async saved(@Req() request: ApiRequest) {
    const principal = await this.services.auth.principal(request, "saved:read");
    return this.page(
      (await this.services.store.user(principal)).saved,
      request,
      principal.subject,
    );
  }
  @Put("me/saved-places/:place_id")
  async save(@Req() request: ApiRequest, @Param("place_id") id: string) {
    uuidSchema.parse(id);
    const principal = await this.services.auth.principal(
      request,
      "saved:write",
    );
    if (!(await this.services.catalog.byId(id)))
      throw new HttpException("not_found", 404);
    return this.services.store.idempotent(
      principal.subject,
      request.path,
      uuid(),
      "put",
      async () => {
        const data = await this.services.store.user(principal);
        const existing = data.saved.find((item) => item.place_id === id);
        if (existing) return existing;
        if (data.saved.length >= 50)
          throw new HttpException("sandbox_save_limit", 422);
        const saved = { place_id: id, saved_at: new Date().toISOString() };
        data.saved.push(saved);
        await this.services.store.saveUser(principal, data);
        return saved;
      },
    );
  }
  @Delete("me/saved-places/:place_id")
  @HttpCode(204)
  async unsave(@Req() request: ApiRequest, @Param("place_id") id: string) {
    uuidSchema.parse(id);
    const principal = await this.services.auth.principal(
      request,
      "saved:write",
    );
    await this.services.store.idempotent(
      `${principal.issuer}:${principal.subject}`,
      request.path,
      uuid(),
      "delete",
      async () => {
        const data = await this.services.store.user(principal);
        data.saved = data.saved.filter((item) => item.place_id !== id);
        await this.services.store.saveUser(principal, data);
      },
    );
  }
  @Get("me/presets")
  async presets(@Req() request: ApiRequest) {
    const principal = await this.services.auth.principal(
      request,
      "presets:read",
    );
    return this.page(
      (await this.services.store.user(principal)).presets,
      request,
      principal.subject,
    );
  }
  @Post("me/presets")
  async preset(
    @Req() request: ApiRequest,
    @Body() body: unknown,
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    const input = presetSchema.parse(body),
      principal = await this.services.auth.principal(request, "presets:write");
    if (input.save_location || input.search.center.kind !== "city")
      throw new HttpException("choose_city_for_preset", 422);
    if (input.search.cursor) throw new HttpException("cannot_save_cursor", 422);
    const result = await this.write(
      request,
      `${principal.issuer}:${principal.subject}`,
      async () => {
        const data = await this.services.store.user(principal);
        if (data.presets.length >= 50)
          throw new HttpException("sandbox_preset_limit", 422);
        if (data.presets.some((preset) => preset.name === input.name))
          throw new Conflict();
        const at = new Date().toISOString(),
          created = {
            id: uuid(),
            name: input.name,
            search: input.search,
            saved_location: false,
            created_at: at,
            updated_at: at,
            version: 1,
          };
        data.presets.push(created);
        await this.services.store.saveUser(principal, data);
        return created;
      },
    );
    response.setHeader("Location", `/v1/me/presets/${result.id}`);
    return result;
  }
  @Get("me/presets/:preset_id")
  async ownPreset(
    @Req() request: ApiRequest,
    @Param("preset_id") id: string,
    @Res({ passthrough: true }) response: ResponseLike,
  ) {
    uuidSchema.parse(id);
    const principal = await this.services.auth.principal(
      request,
      "presets:read",
    );
    const found = (await this.services.store.user(principal)).presets.find(
      (preset) => preset.id === id,
    );
    if (!found) throw new HttpException("not_found", 404);
    response.setHeader("ETag", `"${found.version}"`);
    return found;
  }
  @Delete("me/presets/:preset_id")
  @HttpCode(204)
  async removePreset(
    @Req() request: ApiRequest,
    @Param("preset_id") id: string,
  ) {
    uuidSchema.parse(id);
    const principal = await this.services.auth.principal(
      request,
      "presets:write",
    );
    await this.services.store.idempotent(
      `${principal.issuer}:${principal.subject}`,
      request.path,
      uuid(),
      "delete",
      async () => {
        const data = await this.services.store.user(principal),
          found = data.presets.find((preset) => preset.id === id);
        if (!found) throw new HttpException("not_found", 404);
        if (!header(request, "if-match"))
          throw new HttpException("precondition_required", 428);
        if (header(request, "if-match") !== `"${found.version}"`)
          throw new HttpException("stale_version", 412);
        data.presets = data.presets.filter((preset) => preset.id !== id);
        await this.services.store.saveUser(principal, data);
      },
    );
  }
  @Post("reports")
  @HttpCode(202)
  async report(@Req() request: ApiRequest, @Body() body: unknown) {
    const input = reportSchema.parse(body),
      proof = await this.services.auth.proof(request);
    return this.write(request, proof, () =>
      this.services.store.receipt(proof, "report", input),
    );
  }
  @Post("contact")
  @HttpCode(202)
  async contact(@Req() request: ApiRequest, @Body() body: unknown) {
    const input = z
        .strictObject({
          topic: z.enum([
            "support",
            "privacy",
            "accessibility",
            "security",
            "other",
          ]),
          message: z.string().min(1).max(3000),
          email: z.email().max(254).optional(),
        })
        .parse(body),
      proof = await this.services.auth.proof(request);
    return this.write(request, proof, () =>
      this.services.store.receipt(proof, "contact", input),
    );
  }
  @Post("me/data-subject-requests")
  @HttpCode(202)
  async requestRights(@Req() request: ApiRequest, @Body() body: unknown) {
    const input = dsrSchema.parse(body),
      principal = await this.services.auth.principal(request, "rights:write");
    return this.write(request, principal.subject, () =>
      this.services.store.receipt(principal.subject, "rights", input),
    );
  }
  private write<T>(
    request: ApiRequest,
    scope: string,
    execute: () => Promise<T>,
  ) {
    const key = header(request, "idempotency-key");
    if (!key || key.length < 16 || key.length > 128)
      throw new HttpException("idempotency_key_required", 422);
    return this.services.store.idempotent(
      scope,
      request.path,
      key,
      JSON.stringify(request.body),
      execute,
    );
  }
  private page<T>(items: readonly T[], request: ApiRequest, scope: string) {
    const input = z
      .strictObject({
        page_size: z.coerce.number().int().min(1).max(50).default(20),
        cursor: z.string().max(8192).optional(),
      })
      .parse(request.query);
    try {
      return paginate(
        items,
        input.page_size,
        input.cursor,
        scope,
        config.secret,
      );
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : "invalid_cursor",
        422,
      );
    }
  }
}
@Module({ controllers: [ApiController], providers: [Services] })
class ApiModule {}
export async function bootstrap() {
  const app = await NestFactory.create(ApiModule, {
    logger: false,
    bodyParser: false,
  });
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
    }),
  );
  const limiter = new RateLimiter(config.secret),
    networkLimiter = new RateLimiter(config.secret),
    quotaAuth = new Authentication(config);
  app.use(
    async (request: ApiRequest, response: ServerResponse, next: () => void) => {
      request.correlationId = correlation(header(request, "x-correlation-id"));
      response.setHeader("X-Correlation-ID", request.correlationId);
      response.setHeader("Cache-Control", "no-store");
      const address = request.socket.remoteAddress ?? "unknown";
      let subject = address;
      if (header(request, "x-purpose-token"))
        try {
          subject = await quotaAuth.proof(request);
        } catch {
          /* Invalid proofs never gain a separate quota identity. */
        }
      const category =
        request.path === "/v1/searches"
          ? "search"
          : request.method === "GET"
            ? "read"
            : "write";
      if (
        !networkLimiter.allow(address, 300) ||
        !limiter.allow(`${category}:${subject}`, category === "read" ? 120 : 30)
      ) {
        response.writeHead(429, {
          "Content-Type": "application/problem+json",
          "Retry-After": "60",
        });
        response.end(
          JSON.stringify({
            type: "urn:aroundate:problem:rate_limit",
            title: "Too many requests",
            detail: "rate_limit",
            status: 429,
            correlation_id: request.correlationId,
          }),
        );
        return;
      }
      next();
    },
  );
  app.enableCors({
    origin: config.WEB_ORIGIN,
    credentials: false,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "If-Match",
      "If-None-Match",
    ],
  });
  // Nest's Express adapter parser defaults are explicitly overridden before initialization.
  const express = await import("express");
  app.use(express.json({ limit: "64kb", strict: true }));
  app.use(
    (
      request: ApiRequest,
      _response: ServerResponse,
      next: (error?: unknown) => void,
    ) => {
      try {
        if (
          request.path === "/v1/taxonomies" ||
          /^\/v1\/places\//.test(request.path)
        )
          z.strictObject({ locale: z.enum(["es-CR", "en"]).optional() }).parse(
            request.query,
          );
        else if (
          !["/v1/me/saved-places", "/v1/me/presets"].includes(request.path)
        )
          z.strictObject({}).parse(request.query);
        next();
      } catch (error) {
        next(error);
      }
    },
  );
  app.useGlobalFilters(new Problems());
  await app.listen(config.API_PORT, config.API_HOST);
  console.log(
    JSON.stringify({
      event: "api_ready",
      mode: config.APP_MODE,
      port: config.API_PORT,
    }),
  );
  return app;
}
await bootstrap();
