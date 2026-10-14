import { createHmac, randomUUID } from "node:crypto";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import { HttpException } from "@nestjs/common";
import type { loadConfig } from "../../../packages/config/index.js";
import type { Principal } from "./application/store.js";
export interface ApiRequest {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  query: Record<string, unknown>;
  method: string;
  path: string;
  socket: { remoteAddress?: string };
  correlationId: string;
}
export const header = (request: ApiRequest, key: string) => {
  const value = request.headers[key.toLowerCase()];
  return typeof value === "string" ? value : undefined;
};
export class Authentication {
  private jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
  constructor(private config: ReturnType<typeof loadConfig>) {
    if (config.OIDC_ISSUER) {
      const url = new URL(config.OIDC_ISSUER);
      if (config.NODE_ENV === "production" && url.protocol !== "https:")
        throw new Error("HTTPS issuer required");
      this.jwks = createRemoteJWKSet(
        new URL(
          `${config.OIDC_ISSUER.replace(/\/$/, "")}/protocol/openid-connect/certs`,
        ),
        { timeoutDuration: 2000, cooldownDuration: 30000 },
      );
    }
  }
  async principal(request: ApiRequest, scope: string): Promise<Principal> {
    const token = header(request, "authorization")?.match(
      /^Bearer (\S+)$/,
    )?.[1];
    if (!token) throw new HttpException("authentication_required", 401);
    try {
      const sandbox =
        this.config.APP_MODE === "sandbox" &&
        decodeJwt(token).iss === "aroundate-sandbox";
      if (!sandbox && !this.jwks)
        throw new HttpException("identity_not_configured", 401);
      const { payload } = await jwtVerify(
        token,
        sandbox ? Buffer.from(this.config.secret, "base64url") : this.jwks!,
        {
          issuer: sandbox ? "aroundate-sandbox" : this.config.OIDC_ISSUER!,
          audience: sandbox ? "aroundate-api" : this.config.OIDC_AUDIENCE,
          algorithms: sandbox ? ["HS256"] : ["RS256"],
          requiredClaims: ["exp", "iat", "sub"],
          clockTolerance: 30,
          maxTokenAge: "5m",
        },
      );
      const scopes =
        typeof payload.scope === "string" ? payload.scope.split(" ") : [];
      if (
        typeof payload.exp !== "number" ||
        typeof payload.iat !== "number" ||
        payload.exp - payload.iat > 300
      )
        throw new HttpException("token_lifetime_exceeded", 401);
      if (!scopes.includes(scope))
        throw new HttpException("insufficient_scope", 403);
      return {
        issuer: payload.iss!,
        subject: payload.sub!,
        scopes,
        verified: payload.email_verified === true,
        authTime: typeof payload.auth_time === "number" ? payload.auth_time : 0,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException("invalid_token", 401);
    }
  }
  async proof(request: ApiRequest): Promise<string> {
    const token = header(request, "x-purpose-token");
    if (!token) throw new HttpException("purpose_session_required", 401);
    try {
      const { payload } = await jwtVerify(
        token,
        Buffer.from(this.config.secret, "base64url"),
        {
          issuer: "aroundate-purpose",
          audience: "aroundate-consent",
          algorithms: ["HS256"],
          requiredClaims: ["exp", "sub"],
        },
      );
      return createHmac("sha256", this.config.secret)
        .update(payload.sub!)
        .digest("hex");
    } catch {
      throw new HttpException("invalid_purpose_session", 401);
    }
  }
}
export class RateLimiter {
  private entries = new Map<string, { count: number; expires: number }>();
  constructor(private secret: string) {}
  allow(address: string, limit: number, now = Date.now()) {
    for (const [key, entry] of this.entries)
      if (entry.expires <= now) this.entries.delete(key);
    const key = createHmac("sha256", this.secret).update(address).digest("hex");
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { count: 0, expires: now + 60000 };
      this.entries.set(key, entry);
    }
    entry.count++;
    return entry.count <= limit;
  }
}
export const correlation = (value: unknown) =>
  typeof value === "string" &&
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)
    ? value
    : randomUUID();
