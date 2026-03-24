import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  if (!isValidObjectId(childId)) {
    return NextResponse.json({ error: "Invalid child ID" }, { status: 400 });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const setFields: Record<string, unknown> = {};

  if (body.firstName !== undefined) {
    if (typeof body.firstName !== "string" || !body.firstName.trim()) {
      return NextResponse.json(
        { error: "First name cannot be empty." },
        { status: 400 }
      );
    }
    setFields["children.$.firstName"] = body.firstName.trim();
  }
  if (body.lastName !== undefined) {
    if (typeof body.lastName !== "string" || !body.lastName.trim()) {
      return NextResponse.json(
        { error: "Last name cannot be empty." },
        { status: 400 }
      );
    }
    setFields["children.$.lastName"] = body.lastName.trim();
  }
  if (body.dateOfBirth !== undefined) {
    if (isNaN(new Date(body.dateOfBirth).getTime())) {
      return NextResponse.json(
        { error: "Invalid date of birth." },
        { status: 400 }
      );
    }
    setFields["children.$.dateOfBirth"] = new Date(
      body.dateOfBirth
    ).toISOString();
  }
  if (body.grade !== undefined) {
    setFields["children.$.grade"] =
      body.grade && typeof body.grade === "string"
        ? body.grade.trim()
        : undefined;
  }
  if (body.allergies !== undefined) {
    setFields["children.$.allergies"] =
      body.allergies && typeof body.allergies === "string"
        ? body.allergies.trim()
        : undefined;
  }
  if (body.medicalNotes !== undefined) {
    setFields["children.$.medicalNotes"] =
      body.medicalNotes && typeof body.medicalNotes === "string"
        ? body.medicalNotes.trim()
        : undefined;
  }
  if (body.notes !== undefined) {
    setFields["children.$.notes"] =
      body.notes && typeof body.notes === "string"
        ? body.notes.trim()
        : undefined;
  }

  if (Object.keys(setFields).length === 0) {
    return NextResponse.json(
      { error: "No fields to update." },
      { status: 400 }
    );
  }

  setFields["children.$.updatedAt"] = new Date();

  const db = await getDb();
  const result = await db.collection("families").findOneAndUpdate(
    {
      $or: [{ userId: new ObjectId(user._id) }, { linkedUserIds: new ObjectId(user._id) }],
      "children._id": new ObjectId(childId),
    },
    { $set: { ...setFields, updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json(
      { error: "Child not found in your family." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    family: { ...result, id: result._id.toString() },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;
  if (!isValidObjectId(childId)) {
    return NextResponse.json({ error: "Invalid child ID" }, { status: 400 });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const result = await db.collection("families").findOneAndUpdate(
    { $or: [{ userId: new ObjectId(user._id) }, { linkedUserIds: new ObjectId(user._id) }] },
    {
      $pull: { children: { _id: new ObjectId(childId) } as never },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json(
      { error: "Family not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    family: { ...result, id: result._id.toString() },
  });
}
