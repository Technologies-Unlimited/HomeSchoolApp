import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request as any);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const rejectionReason = typeof body?.reason === "string" ? body.reason : undefined;

  const db = await getDb();
  await db.collection("events").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status: "draft",
        rejectionReason,
        updatedAt: new Date(),
      },
    }
  );

  return NextResponse.json({ success: true });
}
