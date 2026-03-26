import { isValidObjectId } from "@/lib/objectid";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin, isValidRole } from "@/lib/roles";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const role = typeof body?.role === "string" ? body.role : null;
    if (!role || !isValidRole(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: user, admin, super_admin." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    const previousRole = targetUser?.role ?? "user";

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    const actorName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin";
    const targetName = targetUser ? `${targetUser.firstName ?? ""} ${targetUser.lastName ?? ""}`.trim() || targetUser.email : id;
    await logAudit(db, {
      action: "role_change",
      actorId: user.id,
      actorName,
      targetType: "user",
      targetId: id,
      details: `Changed ${targetName} role from ${previousRole} to ${role}`,
      previousState: { role: previousRole },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
