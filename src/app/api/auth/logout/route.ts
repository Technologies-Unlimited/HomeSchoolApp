import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  console.log("[LOGOUT] POST /api/auth/logout — request received");
  await clearAuthCookie();
  console.log("[LOGOUT] Auth cookie cleared — responding 200");
  return NextResponse.json({ success: true });
}
