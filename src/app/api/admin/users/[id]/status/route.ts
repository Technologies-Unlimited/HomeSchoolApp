import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { isValidObjectId } from "@/lib/objectid";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    if (id === user.id) {
      return NextResponse.json({ error: "Cannot deactivate your own account." }, { status: 400 });
    }

    const body = await request.json();
    const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;
    if (isActive === undefined) {
      return NextResponse.json({ error: "isActive field required." }, { status: 400 });
    }

    const db = await getDb();
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) });

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive, updatedAt: new Date() } }
    );

    const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin";
    const targetName = targetUser ? `${targetUser.firstName ?? ""} ${targetUser.lastName ?? ""}`.trim() || targetUser.email : id;
    await logAudit(db, {
      action: isActive ? "member_reactivated" : "member_deactivated",
      actorId: user.id,
      actorName,
      targetType: "user",
      targetId: id,
      details: `${isActive ? "Reactivated" : "Deactivated"} ${targetName}`,
      previousState: { isActive: targetUser?.isActive ?? true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
