import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isAdmin } from "@/lib/roles";
import { sendNotificationEmail } from "@/lib/notifications";
import { buildInviteEmailHtml } from "@/lib/invite-email";


export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, message } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const inviteRole = role === "admin" ? "admin" : "user";

    // Check if already registered
    const db = await getDb();
    const existing = await db.collection("users").findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }

    // Check for duplicate pending invite
    const existingInvite = await db.collection("invites").findOne({
      email: normalizedEmail,
      status: "pending",
    });
    if (existingInvite) {
      return NextResponse.json({ error: "An invite has already been sent to this email." }, { status: 409 });
    }

    const { getBaseUrl } = await import("@/lib/base-url");
    const baseUrl = getBaseUrl();

    // Store the invite
    const now = new Date();
    await db.collection("invites").insertOne({
      email: normalizedEmail,
      role: inviteRole,
      message: typeof message === "string" ? message.trim() : "",
      invitedBy: user.id,
      invitedByName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "Admin",
      status: "pending",
      createdAt: now,
    });

    const inviterName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "An administrator";
    const registerUrl = `${baseUrl}/register?invite=${encodeURIComponent(normalizedEmail)}`;

    const html = buildInviteEmailHtml({
      inviterName,
      registerUrl,
      role: inviteRole,
      personalMessage: message?.trim(),
    });

    try {
      await sendNotificationEmail({
        to: normalizedEmail,
        subject: `${inviterName} invited you to Home School Group`,
        html,
      });
    } catch (err) {
      console.error("[INVITE] Failed to send email:", err);
      return NextResponse.json({ error: "Failed to send invite email." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const invites = await db
      .collection("invites")
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      invites: invites.map((invite) => ({
        id: invite._id.toString(),
        email: invite.email,
        role: invite.role,
        status: invite.status,
        invitedByName: invite.invitedByName,
        createdAt: invite.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
