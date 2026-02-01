import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request as any);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  await db.collection("events").updateOne(
    { _id: new ObjectId(params.id) },
    {
      $set: {
        status: "published",
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ success: true });
}
