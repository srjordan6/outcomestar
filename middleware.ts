import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pass-through. Parent route boundary defined here for future auth gates.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/parent/:slug*"],
};