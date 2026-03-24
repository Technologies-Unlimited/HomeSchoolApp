import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  console.log("[AUTH/ME] GET /api/auth/me — request received");
  const user = await getUserFromRequest(request);
  if (!user) {
    console.log("[AUTH/ME] No authenticated user found — responding with null");
    return NextResponse.json({ user: null });
  }

  console.log("[AUTH/ME] Authenticated user:", user.id, "email:", user.email, "role:", user.role ?? "user");
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role ?? "user",
      emailVerified: user.emailVerified ?? false,
      approved: user.approved ?? false,
    },
  });
}
