import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request as any);
  if (!user || (user.id !== id && !isAdmin(user.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const profile = await db.collection("users").findOne({
    _id: new ObjectId(id),
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: profile._id.toString(),
      email: profile.email,
      phone: profile.phone,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role ?? "user",
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request as any);
  if (!user || (user.id !== id && !isAdmin(user.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (typeof body?.firstName === "string") update.firstName = body.firstName;
  if (typeof body?.lastName === "string") update.lastName = body.lastName;
  if (typeof body?.phone === "string") update.phone = body.phone;

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...update, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
