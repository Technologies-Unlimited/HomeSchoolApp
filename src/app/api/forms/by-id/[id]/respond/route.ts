import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!Array.isArray(body?.responses)) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const db = await getDb();
    const form = await db.collection("forms").findOne({
      _id: new ObjectId(id),
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found." }, { status: 404 });
    }

    const response = {
      formId: new ObjectId(id),
      eventId: form.eventId,
      userId: new ObjectId(user._id),
      responses: body.responses,
      submittedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("formResponses").insertOne(response);
    return NextResponse.json({ responseId: result.insertedId.toString() });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
