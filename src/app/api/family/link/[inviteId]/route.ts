import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { isValidObjectId } from "@/lib/objectid";

// PATCH: Accept or decline an invite
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  if (!isValidObjectId(inviteId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action;
    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "Action must be 'accept' or 'decline'." }, { status: 400 });
    }

    const db = await getDb();
    const userId = new ObjectId(user._id);

    const invite = await db.collection("familyInvites").findOne({
      _id: new ObjectId(inviteId),
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found or already responded." }, { status: 404 });
    }

    // Only the recipient can accept/decline
    if (invite.toUserId.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Only the invited person can respond." }, { status: 403 });
    }

    // Update invite status
    await db.collection("familyInvites").updateOne(
      { _id: invite._id },
      { $set: { status: action === "accept" ? "accepted" : "declined", respondedAt: new Date() } }
    );

    if (action === "decline") {
      return NextResponse.json({ success: true, status: "declined" });
    }

    // Accept: link the accounts
    const fromUserId = invite.fromUserId;
    const toUserId = invite.toUserId;

    // Find the accepter's (existing spouse) family — this is the primary family
    const accepterFamily = await db.collection("families").findOne({
      $or: [{ userId: toUserId }, { linkedUserIds: toUserId }],
    });

    // Find the inviter's (new user) family
    const inviterFamily = await db.collection("families").findOne({
      $or: [{ userId: fromUserId }, { linkedUserIds: fromUserId }],
      ...(accepterFamily ? { _id: { $ne: accepterFamily._id } } : {}),
    });

    // Determine the primary family (prefer the accepter's if it exists)
    const primaryFamily = accepterFamily || inviterFamily;
    if (!primaryFamily) {
      return NextResponse.json({ error: "No family found for either user." }, { status: 404 });
    }

    const otherFamily = primaryFamily._id.toString() === accepterFamily?._id.toString() ? inviterFamily : accepterFamily;

    // Merge children from the other family into the primary
    if (otherFamily && otherFamily.children?.length > 0) {
      await db.collection("families").updateOne(
        { _id: primaryFamily._id },
        {
          $push: { children: { $each: otherFamily.children } } as never,
          $set: { updatedAt: new Date() },
        }
      );
      await db.collection("families").deleteOne({ _id: otherFamily._id });
    }

    // If invite has a child to add (from registration), add it if not already merged
    if (invite.childToAdd && !otherFamily) {
      const now = new Date();
      await db.collection("families").updateOne(
        { _id: primaryFamily._id },
        {
          $push: {
            children: {
              _id: new ObjectId(),
              firstName: invite.childToAdd.firstName,
              lastName: invite.childToAdd.lastName,
              dateOfBirth: "",
              createdAt: now,
              updatedAt: now,
            } as never,
          },
          $set: { updatedAt: now },
        }
      );
    }

    // Link both users to the primary family
    const linkedIds = (primaryFamily.linkedUserIds || []).map((linkedId: ObjectId) => linkedId.toString());
    const usersToLink = [fromUserId, toUserId].filter(
      (linkId) => linkId.toString() !== primaryFamily.userId.toString() && !linkedIds.includes(linkId.toString())
    );

    if (usersToLink.length > 0) {
      await db.collection("families").updateOne(
        { _id: primaryFamily._id },
        {
          $push: { linkedUserIds: { $each: usersToLink } } as never,
          $set: { updatedAt: new Date() },
        }
      );
    }

    return NextResponse.json({ success: true, status: "accepted" });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE: Cancel a pending invite (sender only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  if (!isValidObjectId(inviteId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const userId = new ObjectId(user._id);

    const invite = await db.collection("familyInvites").findOne({
      _id: new ObjectId(inviteId),
      status: "pending",
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    // Only sender can cancel
    if (invite.fromUserId.toString() !== userId.toString()) {
      return NextResponse.json({ error: "Only the sender can cancel an invite." }, { status: 403 });
    }

    await db.collection("familyInvites").updateOne(
      { _id: invite._id },
      { $set: { status: "cancelled", respondedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
