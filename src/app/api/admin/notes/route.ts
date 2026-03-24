import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const notes = await db
    .collection("adminNotes")
    .find({})
    .sort({ updatedAt: -1 })
    .limit(1)
    .toArray();

  return NextResponse.json({ content: notes[0]?.content ?? "" });
}

export async function PUT(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const content = typeof body?.content === "string" ? body.content : "";

  const db = await getDb();
  await db.collection("adminNotes").updateOne(
    { type: "shared" },
    {
      $set: {
        content,
        lastEditedBy: new ObjectId(user._id),
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return NextResponse.json({ success: true });
}
