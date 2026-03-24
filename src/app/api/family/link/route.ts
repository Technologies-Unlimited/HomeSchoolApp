import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";

// GET: List pending invites for the current user (both sent and received)
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const userId = new ObjectId(user._id);

  const invites = await db
    .collection("familyInvites")
    .find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      status: "pending",
    })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite._id.toString(),
      fromUserId: invite.fromUserId.toString(),
      fromUserName: invite.fromUserName,
      fromUserEmail: invite.fromUserEmail,
      toUserId: invite.toUserId.toString(),
      toUserName: invite.toUserName,
      toUserEmail: invite.toUserEmail,
      status: invite.status,
      createdAt: invite.createdAt,
      direction: invite.fromUserId.toString() === userId.toString() ? "sent" : "received",
    })),
  });
}

// POST: Send a link invite to a spouse/partner by email
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (email === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "You can't link your own account." }, { status: 400 });
  }

  const db = await getDb();
  const userId = new ObjectId(user._id);

  const spouseUser = await db.collection("users").findOne({ email });
  if (!spouseUser) {
    return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
  }

  const spouseId = spouseUser._id;

  // Check not already linked
  const family = await db.collection("families").findOne({
    $or: [{ userId }, { linkedUserIds: userId }],
  });
  if (family) {
    const alreadyLinked = (family.linkedUserIds || []).some(
      (linkedId: ObjectId) => linkedId.toString() === spouseId.toString()
    );
    if (alreadyLinked) {
      return NextResponse.json({ error: "This account is already linked to your family." }, { status: 400 });
    }
  }

  // Check no pending invite already exists
  const existingInvite = await db.collection("familyInvites").findOne({
    fromUserId: userId,
    toUserId: spouseId,
    status: "pending",
  });
  if (existingInvite) {
    return NextResponse.json({ error: "An invite is already pending for this person." }, { status: 400 });
  }

  const fromName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "";
  const toName = [spouseUser.firstName, spouseUser.lastName].filter(Boolean).join(" ") || spouseUser.email || "";

  await db.collection("familyInvites").insertOne({
    fromUserId: userId,
    fromUserName: fromName,
    fromUserEmail: user.email,
    toUserId: spouseId,
    toUserName: toName,
    toUserEmail: spouseUser.email,
    status: "pending",
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

// DELETE: Unlink a spouse/partner (or cancel a pending invite)
export async function DELETE(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const unlinkUserId = typeof body?.userId === "string" ? body.userId : "";
  if (!unlinkUserId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const db = await getDb();
  const userId = new ObjectId(user._id);

  const family = await db.collection("families").findOne({
    $or: [{ userId }, { linkedUserIds: userId }],
  });

  if (!family) {
    return NextResponse.json({ error: "Family not found." }, { status: 404 });
  }

  const isOwner = family.userId.toString() === userId.toString();
  const isSelf = unlinkUserId === userId.toString();
  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: "Only the family owner can remove linked accounts." }, { status: 403 });
  }

  await db.collection("families").updateOne(
    { _id: family._id },
    {
      $pull: { linkedUserIds: new ObjectId(unlinkUserId) } as never,
      $set: { updatedAt: new Date() },
    }
  );

  return NextResponse.json({ success: true });
}
