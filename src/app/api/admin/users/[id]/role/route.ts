import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin, isValidRole } from "@/lib/roles";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const role = typeof body?.role === "string" ? body.role : null;
  if (!role || !isValidRole(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be one of: user, admin, super_admin." },
      { status: 400 }
    );
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: { role, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
