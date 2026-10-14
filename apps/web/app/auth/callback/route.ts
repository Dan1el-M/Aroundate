import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  cookieName,
  cookieOptions,
  origin,
  problem,
  sessions,
} from "../../../lib/server";
import { exchangeCode, flows } from "../../../lib/oidc";
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state"),
    code = request.nextUrl.searchParams.get("code");
  const flow = state ? flows.get(state) : undefined;
  if (state) flows.delete(state);
  if (
    !flow ||
    !code ||
    code.length > 2048 ||
    flow.expires < Date.now() ||
    request.cookies.get(cookieName("proof"))?.value !== flow.proof
  )
    return problem(400, "invalid_login_state");
  try {
    const value = await exchangeCode(code, flow, `${origin}/auth/callback`),
      id = randomBytes(32).toString("base64url");
    const previous = request.cookies.get(cookieName("session"))?.value;
    if (previous) sessions.delete(previous);
    sessions.set(id, value);
    const response = NextResponse.redirect(new URL("/account", origin));
    response.cookies.set(cookieName("session"), id, {
      ...cookieOptions,
      maxAge: 43200,
    });
    return response;
  } catch {
    return problem(401, "identity_login_failed");
  }
}
