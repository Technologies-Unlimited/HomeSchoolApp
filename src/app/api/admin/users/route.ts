import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request as any);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const users = await db
    .collection("users")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    users: users.map((item) => ({
      id: item._id.toString(),
      email: item.email,
      phone: item.phone,
      firstName: item.firstName,
      lastName: item.lastName,
      role: item.role ?? "user",
      isActive: item.isActive ?? true,
    })),
  });
}
