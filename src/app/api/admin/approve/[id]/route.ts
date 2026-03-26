import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { isValidObjectId } from "@/lib/objectid";
import { sendNotificationEmail } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";

// POST: Approve a user
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !isAdmin(admin.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (targetUser.approved) {
      return NextResponse.json({ error: "User is already approved." }, { status: 400 });
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: true, approvedAt: new Date(), approvedBy: admin._id, updatedAt: new Date() } }
    );

    const adminName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email || "Admin";
    const targetName = `${targetUser.firstName ?? ""} ${targetUser.lastName ?? ""}`.trim() || targetUser.email;
    await logAudit(db, {
      action: "member_approved",
      actorId: admin.id,
      actorName: adminName,
      targetType: "user",
      targetId: id,
      details: `Approved ${targetName}`,
      previousState: { approved: false },
    });

    // Send approval email to the user
    try {
      await sendNotificationEmail({
        to: targetUser.email,
        subject: "You've been approved — Home School Group",
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
            <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px;">Welcome to the group!</h2>
            <p style="margin:0 0 24px;color:#475569;font-size:14px;">Hi ${targetUser.firstName}, your account has been approved. You now have full access to events, the family directory, and all community features.</p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">Log in at your convenience to get started.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[APPROVE] Failed to send approval email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE: Deny/reject a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const admin = await getUserFromRequest(request);
    if (!admin || !isAdmin(admin.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const targetUser = await db.collection("users").findOne({ _id: new ObjectId(id) });

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { approved: false, isActive: false, updatedAt: new Date() } }
    );

    const denyAdminName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email || "Admin";
    const denyTargetName = targetUser ? `${targetUser.firstName ?? ""} ${targetUser.lastName ?? ""}`.trim() || targetUser.email : id;
    await logAudit(db, {
      action: "member_denied",
      actorId: admin.id,
      actorName: denyAdminName,
      targetType: "user",
      targetId: id,
      details: `Denied ${denyTargetName}`,
      previousState: { approved: targetUser?.approved ?? false, isActive: targetUser?.isActive ?? true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
