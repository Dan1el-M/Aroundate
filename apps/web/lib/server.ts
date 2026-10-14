import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
export const secure = process.env.NODE_ENV === "production";
export const cookieName = (name: string) =>
  `${secure ? "__Host-" : ""}aroundate_${name}`;
const root = globalThis as typeof globalThis & {
  aroundateSecret?: string;
  aroundateSessions?: Map<string, Session>;
};
export const secret =
  process.env.SESSION_SECRET ??
  (root.aroundateSecret ??= randomBytes(32).toString("base64url"));
export const mode = process.env.APP_MODE ?? "sandbox";
export const origin = process.env.WEB_ORIGIN ?? "http://127.0.0.1:3000";
export const cookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "lax" as const,
  path: "/",
};
export interface Session {
  subject: string;
  accessToken: string;
  refreshToken?: string;
  issuer?: string;
  expiresAt: number;
  createdAt: number;
  lastSeen: number;
  termsVersion?: string;
  termsAcceptedAt?: number;
}
export const sessions = (root.aroundateSessions ??= new Map<string, Session>());
export const mac = (text: string) =>
  createHmac("sha256", secret).update(text).digest("base64url");
export function validProof(value: string | undefined): value is string {
  if (!value) return false;
  const [id, sig] = value.split(".");
  if (!id || !sig) return false;
  const expected = mac(id);
  return (
    sig.length === expected.length &&
    timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}
export const newProof = () => {
  const id = randomBytes(24).toString("base64url");
  return `${id}.${mac(id)}`;
};
export const csrfFor = (proof: string) => mac(`csrf:${proof}`);
export function csrf(request: NextRequest) {
  const proof = request.cookies.get(cookieName("proof"))?.value;
  const submitted = request.headers.get("x-csrf-token");
  return (
    request.headers.get("origin") === origin &&
    validProof(proof) &&
    submitted === csrfFor(proof)
  );
}
export async function tokenForProof(proof: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("aroundate-purpose")
    .setAudience("aroundate-consent")
    .setSubject(proof)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(Buffer.from(secret, "base64url"));
}
export async function demoToken(subject: string) {
  const scopes =
    "profile:read profile:write saved:read saved:write presets:read presets:write rights:read rights:write";
  return new SignJWT({
    scope: scopes,
    email_verified: true,
    auth_time: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("aroundate-sandbox")
    .setAudience("aroundate-api")
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(Buffer.from(secret, "base64url"));
}
export async function session() {
  const jar = await cookies();
  const id = jar.get(cookieName("session"))?.value;
  if (!id) return undefined;
  const value = sessions.get(id);
  if (!value) return undefined;
  const now = Date.now();
  if (
    now - value.createdAt > 12 * 3600000 ||
    now - value.lastSeen > 30 * 60000
  ) {
    sessions.delete(id);
    return undefined;
  }
  value.lastSeen = now;
  if (value.expiresAt < now + 30000) {
    if (value.issuer && value.refreshToken) {
      try {
        const { refreshSession } = await import("./oidc");
        await refreshSession(value);
      } catch {
        sessions.delete(id);
        return undefined;
      }
    } else if (mode === "sandbox" && !secure) {
      value.accessToken = await demoToken(value.subject);
      value.expiresAt = now + 5 * 60000;
    } else {
      sessions.delete(id);
      return undefined;
    }
  }
  return value;
}
export function problem(status: number, detail: string) {
  return NextResponse.json(
    {
      type: `urn:aroundate:problem:${detail}`,
      title: "Request could not be completed",
      status,
      detail,
    },
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        "Cache-Control": "no-store",
      },
    },
  );
}
export function pruneSessions() {
  for (const [id, value] of sessions)
    if (
      Date.now() - value.createdAt > 12 * 3600000 ||
      Date.now() - value.lastSeen > 30 * 60000
    )
      sessions.delete(id);
}
