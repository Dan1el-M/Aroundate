import { NextResponse, type NextRequest } from "next/server";
import {
  cookieName,
  cookieOptions,
  csrf,
  problem,
  sessions,
} from "../../../lib/server";
export async function POST(request: NextRequest) {
  if (!csrf(request)) return problem(403, "csrf_failed");
  const id = request.cookies.get(cookieName("session"))?.value;
  if (id) sessions.delete(id);
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(cookieName("session"), "", {
    ...cookieOptions,
    maxAge: 0,
  });
  return response;
}
