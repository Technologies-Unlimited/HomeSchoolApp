import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null });
  }

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
