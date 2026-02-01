import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { getTokenFromRequest, verifyToken } from "./auth";

export async function getUserFromRequest(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    const db = await getDb();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.userId),
    });
    if (!user) return null;
    return { ...user, id: user._id.toString() };
  } catch {
    return null;
  }
}
