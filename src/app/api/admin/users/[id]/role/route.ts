import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request as any);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const role = typeof body?.role === "string" ? body.role : null;
  if (!role) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const db = await getDb();
  await db.collection("users").updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { role, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
