import { isValidObjectId } from "@/lib/objectid";
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
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const form = await db.collection("forms").findOne({
    _id: new ObjectId(id),
  });

  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const isOwner = form.creatorId?.toString() === user._id.toString();
  if (!isOwner && !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const responses = await db
    .collection("formResponses")
    .find({ formId: new ObjectId(id) })
    .sort({ submittedAt: -1 })
    .toArray();

  return NextResponse.json({
    responses: responses.map((item) => ({ ...item, id: item._id.toString() })),
  });
}
