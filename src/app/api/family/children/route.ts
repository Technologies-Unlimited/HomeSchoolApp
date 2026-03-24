import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { firstName, lastName, dateOfBirth, grade, allergies, medicalNotes } =
    body;

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    return NextResponse.json(
      { error: "First name is required." },
      { status: 400 }
    );
  }
  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    return NextResponse.json(
      { error: "Last name is required." },
      { status: 400 }
    );
  }
  if (!dateOfBirth || isNaN(new Date(dateOfBirth).getTime())) {
    return NextResponse.json(
      { error: "Valid date of birth is required." },
      { status: 400 }
    );
  }

  const now = new Date();
  const childDocument = {
    _id: new ObjectId(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    dateOfBirth: new Date(dateOfBirth).toISOString(),
    grade: grade && typeof grade === "string" ? grade.trim() : undefined,
    allergies:
      allergies && typeof allergies === "string" ? allergies.trim() : undefined,
    medicalNotes:
      medicalNotes && typeof medicalNotes === "string"
        ? medicalNotes.trim()
        : undefined,
    notes:
      body.notes && typeof body.notes === "string"
        ? body.notes.trim()
        : undefined,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDb();
  const result = await db.collection("families").findOneAndUpdate(
    { $or: [{ userId: new ObjectId(user._id) }, { linkedUserIds: new ObjectId(user._id) }] },
    {
      $push: { children: childDocument as never },
      $set: { updatedAt: now },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    return NextResponse.json(
      { error: "Family not found. Please visit your family page first." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    child: { ...childDocument, id: childDocument._id.toString() },
    family: { ...result, id: result._id.toString() },
  });
}
