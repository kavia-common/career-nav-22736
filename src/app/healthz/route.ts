import { NextResponse } from "next/server";

// PUBLIC_INTERFACE
export async function GET() {
  /** Health check endpoint for container/platform probes. Returns 200 OK with JSON payload. */
  return NextResponse.json(
    {
      ok: true,
      service: "career-nav-frontend"
    },
    { status: 200 }
  );
}
