import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = {};
  if (Array.isArray(body?.fields)) update.fields = body.fields;
  if (typeof body?.formType === "string") update.formType = body.formType;
  if (typeof body?.isActive === "boolean") update.isActive = body.isActive;

  const db = await getDb();
  await db.collection("forms").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...update, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request as any);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("forms").deleteOne({ _id: new ObjectId(id) });

  return NextResponse.json({ success: true });
}
