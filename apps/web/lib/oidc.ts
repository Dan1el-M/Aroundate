import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Session } from "./server";
export const issuer = process.env.OIDC_ISSUER?.replace(/\/$/, "");
export const clientId = process.env.OIDC_CLIENT_ID ?? "aroundate-web";
const scopes =
  "openid profile email profile:read profile:write saved:read saved:write presets:read presets:write rights:read rights:write";
export interface Flow {
  state: string;
  verifier: string;
  nonce: string;
  proof: string;
  expires: number;
  adult: boolean;
}
const global = globalThis as typeof globalThis & {
  aroundateFlows?: Map<string, Flow>;
};
export const flows = (global.aroundateFlows ??= new Map<string, Flow>());
function assertIssuer() {
  if (!issuer) throw new Error("OIDC not configured");
  const url = new URL(issuer);
  if (
    url.protocol !== "https:" &&
    !(
      process.env.NODE_ENV !== "production" &&
      ["127.0.0.1", "localhost"].includes(url.hostname)
    )
  )
    throw new Error("Invalid OIDC transport");
  return issuer;
}
export function createFlow(proof: string): Flow {
  assertIssuer();
  for (const [key, value] of flows)
    if (value.expires < Date.now()) flows.delete(key);
  if (flows.size >= 2000) throw new Error("Login capacity exceeded");
  const flow = {
    state: randomBytes(32).toString("base64url"),
    verifier: randomBytes(48).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    proof,
    expires: Date.now() + 300000,
    adult: true,
  };
  flows.set(flow.state, flow);
  return flow;
}
export function authorization(flow: Flow, redirect: string) {
  const url = new URL(`${assertIssuer()}/protocol/openid-connect/auth`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirect,
    scope: scopes,
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: createHash("sha256")
      .update(flow.verifier)
      .digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}
async function exchange(parameters: Record<string, string>) {
  const response = await fetch(
    `${assertIssuer()}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        ...(process.env.OIDC_CLIENT_SECRET
          ? { client_secret: process.env.OIDC_CLIENT_SECRET }
          : {}),
        ...parameters,
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
      redirect: "error",
    },
  );
  if (!response.ok) throw new Error("Token exchange failed");
  const result = (await response.json()) as Record<string, unknown>;
  if (
    typeof result.access_token !== "string" ||
    typeof result.expires_in !== "number" ||
    result.expires_in <= 0 ||
    result.expires_in > 300
  )
    throw new Error("Invalid short-lived token");
  return result as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  };
}
export async function exchangeCode(
  code: string,
  flow: Flow,
  redirect: string,
): Promise<Session> {
  const tokens = await exchange({
    grant_type: "authorization_code",
    code,
    code_verifier: flow.verifier,
    redirect_uri: redirect,
  });
  if (!tokens.id_token) throw new Error("Missing ID token");
  const jwks = createRemoteJWKSet(
    new URL(`${assertIssuer()}/protocol/openid-connect/certs`),
    { timeoutDuration: 2000 },
  );
  const { payload } = await jwtVerify(tokens.id_token, jwks, {
    issuer: issuer!,
    audience: clientId,
    algorithms: ["RS256"],
    requiredClaims: ["sub", "exp", "iat"],
    clockTolerance: 30,
  });
  if (payload.nonce !== flow.nonce) throw new Error("Nonce mismatch");
  const now = Date.now();
  return {
    subject: payload.sub!,
    accessToken: tokens.access_token,
    ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
    issuer: issuer!,
    expiresAt: now + tokens.expires_in * 1000,
    createdAt: now,
    lastSeen: now,
  };
}
export async function refreshSession(session: Session) {
  if (!session.refreshToken) throw new Error("No refresh token");
  const tokens = await exchange({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });
  session.accessToken = tokens.access_token;
  if (tokens.refresh_token) session.refreshToken = tokens.refresh_token;
  session.expiresAt = Date.now() + tokens.expires_in * 1000;
}
