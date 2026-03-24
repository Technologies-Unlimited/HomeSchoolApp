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

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const locations = await db
    .collection("locations")
    .find({})
    .sort({ name: 1 })
    .toArray();

  return NextResponse.json({
    locations: locations.map((location) => ({
      ...location,
      id: location._id.toString(),
    })),
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, address, notes, category } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Name is required." },
      { status: 400 }
    );
  }
  if (!address || typeof address !== "string" || !address.trim()) {
    return NextResponse.json(
      { error: "Address is required." },
      { status: 400 }
    );
  }
  if (
    category &&
    !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
  ) {
    return NextResponse.json(
      { error: "Invalid category." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const now = new Date();
  const locationDocument = {
    name: name.trim(),
    address: address.trim(),
    notes: notes && typeof notes === "string" ? notes.trim() : undefined,
    category: category || undefined,
    createdBy: new ObjectId(user._id),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("locations").insertOne(locationDocument);

  return NextResponse.json({
    location: {
      ...locationDocument,
      id: result.insertedId.toString(),
    },
  });
}
