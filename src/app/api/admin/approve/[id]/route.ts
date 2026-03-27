import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { isValidObjectId } from "@/lib/objectid";
import { sendNotificationEmail } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notify";

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

    // In-app notification
    await createNotification(db, {
      userId: id,
      type: "account_approved",
      message: "Your account has been approved! You now have full access to the community.",
      linkUrl: "/events",
    });

    // Send approval email to the user
    try {
      const { brandedEmail, ctaButton } = await import("@/lib/email-template");
      const { getBaseUrl } = await import("@/lib/base-url");
      await sendNotificationEmail({
        to: targetUser.email,
        subject: "You've been approved — Home School Group",
        html: brandedEmail({
          icon: "&#127881;",
          headline: "You're In!",
          subtitle: "Your account has been approved",
          body: `
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1e293b;">Hi <strong>${targetUser.firstName}</strong>, great news — an admin has approved your account. You now have full access to everything:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:0 0 16px;">
              <tr>
                <td style="width:33.33%;padding:16px 8px;text-align:center;border-right:1px solid #e2e8f0;">
                  <p style="margin:0 0 4px;font-size:20px;">&#128197;</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#1e293b;">Events & RSVPs</p>
                </td>
                <td style="width:33.33%;padding:16px 8px;text-align:center;border-right:1px solid #e2e8f0;">
                  <p style="margin:0 0 4px;font-size:20px;">&#128106;</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#1e293b;">Family Directory</p>
                </td>
                <td style="width:33.33%;padding:16px 8px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:20px;">&#128276;</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#1e293b;">Announcements</p>
                </td>
              </tr>
            </table>
            ${ctaButton(`${getBaseUrl()}/events`, "Explore Events")}
          `,
          footerText: "Welcome to the Home School Group community!",
        }),
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
