import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  cookieName,
  cookieOptions,
  csrfFor,
  newProof,
  validProof,
} from "./lib/server";
export function proxy(request: NextRequest) {
  const nonce = randomBytes(24).toString("base64");
  const development = process.env.NODE_ENV !== "production";
  const policy = `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}; style-src 'self' ${development ? "'unsafe-inline'" : `'nonce-${nonce}'`}; img-src 'self' data:; font-src 'self'; connect-src 'self'${development ? " ws://127.0.0.1:3000 ws://localhost:3000" : ""}; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'${development ? "" : "; upgrade-insecure-requests"}`;
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", policy);
  const language = request.cookies.get("aroundate_language")?.value;
  headers.set("x-language", language === "en" ? "en" : "es-CR");
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(self), camera=(), microphone=(), payment=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cache-Control", "no-store");
  if (!development)
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  const existing = request.cookies.get(cookieName("proof"))?.value;
  const proof = validProof(existing) ? existing : newProof();
  if (proof !== existing)
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
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
