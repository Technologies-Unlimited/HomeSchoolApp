import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { limit, skip } = parsePagination(request.url);
    const db = await getDb();
    const users = await db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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
        emailVerified: item.emailVerified ?? false,
        approved: item.approved ?? false,
        createdAt: item.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
