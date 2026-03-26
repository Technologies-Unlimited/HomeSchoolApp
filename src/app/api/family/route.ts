import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userId = new ObjectId(user._id);

    // Find family where user is owner OR a linked member
    let family = await db.collection("families").findOne({
      $or: [{ userId }, { linkedUserIds: userId }],
    });

    if (!family) {
      const now = new Date();
      const newFamily = {
        userId,
        emergencyContact: "",
        medicalNotes: "",
        children: [],
        linkedUserIds: [],
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("families").insertOne(newFamily);
      family = { ...newFamily, _id: result.insertedId };
    }

    // Resolve linked user names
    const allUserIds = [family.userId, ...(family.linkedUserIds || [])];
    const users = await db
      .collection("users")
      .find({ _id: { $in: allUserIds } }, { projection: { firstName: 1, lastName: 1, email: 1 } })
      .toArray();

    const linkedMembers = users.map((userDoc) => ({
      id: userDoc._id.toString(),
      name: [userDoc.firstName, userDoc.lastName].filter(Boolean).join(" ") || userDoc.email,
      email: userDoc.email,
      isOwner: userDoc._id.toString() === family!.userId.toString(),
    }));

    return NextResponse.json({
      family: { ...family, id: family._id.toString(), linkedMembers },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updateFields: Record<string, unknown> = {};

    if (body.emergencyContact !== undefined) {
      updateFields.emergencyContact = typeof body.emergencyContact === "string" ? body.emergencyContact.trim() : "";
    }
    if (body.medicalNotes !== undefined) {
      updateFields.medicalNotes = typeof body.medicalNotes === "string" ? body.medicalNotes.trim() : "";
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    updateFields.updatedAt = new Date();

    const db = await getDb();
    const userId = new ObjectId(user._id);
    const result = await db.collection("families").findOneAndUpdate(
      { $or: [{ userId }, { linkedUserIds: userId }] },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    return NextResponse.json({
      family: { ...result, id: result._id.toString() },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
