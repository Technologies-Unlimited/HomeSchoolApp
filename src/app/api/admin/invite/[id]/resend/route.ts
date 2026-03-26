import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { isValidObjectId } from "@/lib/objectid";
import { sendNotificationEmail } from "@/lib/notifications";
import { buildInviteEmailHtml } from "@/lib/invite-email";


export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const db = await getDb();
  const invite = await db.collection("invites").findOne({ _id: new ObjectId(id) });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  const { getBaseUrl } = await import("@/lib/base-url");

  const inviterName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "An administrator";
  const registerUrl = `${getBaseUrl()}/register?invite=${encodeURIComponent(invite.email)}`;

  const html = buildInviteEmailHtml({
    inviterName,
    registerUrl,
    role: invite.role,
    personalMessage: invite.message,
  });

  try {
    await sendNotificationEmail({
      to: invite.email,
      subject: `${inviterName} invited you to Home School Group`,
      html,
    });
  } catch (err) {
    console.error("[INVITE] Failed to resend email:", err);
    return NextResponse.json({ error: "Failed to send invite email." }, { status: 500 });
  }

  await db.collection("invites").updateOne(
    { _id: new ObjectId(id) },
    { $set: { resentAt: new Date(), resentBy: user.id } }
  );

  return NextResponse.json({ success: true });
}
