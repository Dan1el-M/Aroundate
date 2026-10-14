import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  cookieName,
  cookieOptions,
  csrf,
  demoToken,
  mode,
  problem,
  pruneSessions,
  sessions,
} from "../../../lib/server";
export async function POST(request: NextRequest) {
  if (mode !== "sandbox" || process.env.NODE_ENV === "production")
    return problem(404, "not_found");
  if (!csrf(request)) return problem(403, "csrf_failed");
  const input: unknown = await request.json();
  if (
    !input ||
    typeof input !== "object" ||
    !("adult" in input) ||
    input.adult !== true ||
    !("terms_accepted" in input) ||
    input.terms_accepted !== true ||
    !("terms_version" in input) ||
    input.terms_version !== "2026-10-14" ||
    Object.keys(input).some(
      (key) => !["adult", "terms_accepted", "terms_version"].includes(key),
    )
  )
    return problem(422, "age_and_terms_confirmation_required");
  pruneSessions();
  const previous = request.cookies.get(cookieName("session"))?.value;
  if (previous) sessions.delete(previous);
  const id = randomBytes(32).toString("base64url"),
    subject = randomBytes(24).toString("base64url"),
    now = Date.now();
  sessions.set(id, {
    subject,
    accessToken: await demoToken(subject),
    expiresAt: now + 300000,
    createdAt: now,
    lastSeen: now,
    termsVersion: "2026-10-14",
    termsAcceptedAt: now,
  });
  const response = NextResponse.json(
    { authenticated: true, demo: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(cookieName("session"), id, {
    ...cookieOptions,
    maxAge: 43200,
  });
  return response;
}
