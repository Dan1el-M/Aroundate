import { NextResponse, type NextRequest } from "next/server";
import {
  cookieName,
  cookieOptions,
  csrf,
  csrfFor,
  newProof,
  problem,
  session,
  tokenForProof,
  validProof,
} from "../../../lib/server";
const permitted = [
  /^searches$/,
  /^taxonomies$/,
  /^providers\/status$/,
  /^places\/[a-f0-9-]{36}$/,
  /^autocomplete$/,
  /^geocoding$/,
  /^consents$/,
  /^me$/,
  /^me\/saved-places(?:\/[a-f0-9-]{36})?$/,
  /^me\/presets(?:\/[a-f0-9-]{36})?$/,
  /^me\/data-subject-requests$/,
  /^reports$/,
  /^contact$/,
];
async function handle(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const route = path.join("/");
  if (route === "bootstrap" && request.method === "GET") {
    const old = request.cookies.get(cookieName("proof"))?.value;
    const proof = validProof(old) ? old : newProof();
    const current = await session();
    const response = NextResponse.json(
      {
        csrf: csrfFor(proof),
        authenticated: !!current,
        mode: process.env.APP_MODE ?? "sandbox",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(cookieName("proof"), proof, {
      ...cookieOptions,
      maxAge: 180 * 86400,
    });
    response.cookies.set(cookieName("csrf"), csrfFor(proof), {
      ...cookieOptions,
      httpOnly: false,
      maxAge: 180 * 86400,
    });
    return response;
  }
  if (!permitted.some((pattern) => pattern.test(route)))
    return problem(404, "not_found");
  if (!["GET", "HEAD"].includes(request.method) && !csrf(request))
    return problem(403, "csrf_failed");
  const purpose = request.cookies.get(cookieName("proof"))?.value;
  if (!validProof(purpose)) return problem(401, "purpose_session_required");
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-Purpose-Token": await tokenForProof(purpose),
  });
  const current = await session();
  if (current) headers.set("Authorization", `Bearer ${current.accessToken}`);
  for (const key of [
    "Idempotency-Key",
    "If-Match",
    "If-None-Match",
    "Sec-GPC",
    "DNT",
  ]) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }
  let body: string | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 65536) {
          await reader.cancel();
          return problem(413, "request_too_large");
        }
        chunks.push(value);
      }
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  try {
    const upstream = await fetch(
      `${process.env.API_INTERNAL_ORIGIN ?? "http://127.0.0.1:3001"}/v1/${route}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        ...(body !== undefined ? { body } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    const resultHeaders = new Headers({
      "Cache-Control": upstream.headers.get("Cache-Control") ?? "no-store",
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    });
    for (const key of [
      "X-Correlation-ID",
      "Retry-After",
      "ETag",
      "Location",
      "WWW-Authenticate",
    ]) {
      const value = upstream.headers.get(key);
      if (value) resultHeaders.set(key, value);
    }
    return new NextResponse(
      [204, 304].includes(upstream.status) ? null : await upstream.text(),
      { status: upstream.status, headers: resultHeaders },
    );
  } catch {
    return problem(503, "api_unavailable");
  }
}
export const GET = handle,
  POST = handle,
  PUT = handle,
  PATCH = handle,
  DELETE = handle;
