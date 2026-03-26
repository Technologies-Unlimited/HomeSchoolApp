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
    const profile = await db.collection("users").findOne({
      _id: new ObjectId(user.id),
    });

    return NextResponse.json({
      directoryOptIn: profile?.directoryOptIn ?? false,
      shareEmail: profile?.shareEmail ?? false,
      sharePhone: profile?.sharePhone ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = {};

    if (typeof body?.directoryOptIn === "boolean") {
      update.directoryOptIn = body.directoryOptIn;
    }
    if (typeof body?.shareEmail === "boolean") {
      update.shareEmail = body.shareEmail;
    }
    if (typeof body?.sharePhone === "boolean") {
      update.sharePhone = body.sharePhone;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields provided." }, { status: 400 });
    }

    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: new ObjectId(user.id) },
      { $set: { ...update, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
