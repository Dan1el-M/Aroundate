import { NextResponse, type NextRequest } from "next/server";
import {
  cookieName,
  csrf,
  origin,
  problem,
  validProof,
} from "../../../lib/server";
import { authorization, createFlow, issuer } from "../../../lib/oidc";
export async function POST(request: NextRequest) {
  if (!issuer) return problem(503, "identity_not_configured");
  if (!csrf(request)) return problem(403, "csrf_failed");
  const body = (await request.json().catch(() => null)) as {
    adult?: unknown;
  } | null;
  if (body?.adult !== true) return problem(422, "adult_confirmation_required");
  const proof = request.cookies.get(cookieName("proof"))?.value;
  if (!validProof(proof)) return problem(401, "purpose_session_required");
  try {
    const flow = createFlow(proof);
    return NextResponse.json({
      authorize_url: authorization(flow, `${origin}/auth/callback`),
    });
  } catch {
    return problem(503, "identity_unavailable");
  }
}
