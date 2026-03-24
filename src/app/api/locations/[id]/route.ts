import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

const VALID_CATEGORIES = [
  "park",
  "community_center",
  "museum",
  "library",
  "outdoor",
  "other",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updateFields: Record<string, unknown> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Name cannot be empty." },
        { status: 400 }
      );
    }
    updateFields.name = body.name.trim();
  }
  if (body.address !== undefined) {
    if (typeof body.address !== "string" || !body.address.trim()) {
      return NextResponse.json(
        { error: "Address cannot be empty." },
        { status: 400 }
      );
    }
    updateFields.address = body.address.trim();
  }
  if (body.notes !== undefined) {
    updateFields.notes =
      body.notes && typeof body.notes === "string"
        ? body.notes.trim()
        : undefined;
  }
  if (body.category !== undefined) {
    if (
      body.category &&
      !VALID_CATEGORIES.includes(
        body.category as (typeof VALID_CATEGORIES)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid category." },
        { status: 400 }
      );
    }
    updateFields.category = body.category || undefined;
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "No fields to update." },
      { status: 400 }
    );
  }

  updateFields.updatedAt = new Date();

  const db = await getDb();
  const result = await db.collection("locations").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    location: { ...result, id: result._id.toString() },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const result = await db
    .collection("locations")
    .deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
