import { ObjectId } from "mongodb";
import { getDb } from "./db";
import { getTokenFromRequest, verifyToken } from "./auth";

export interface SessionUser {
  id: string;
  _id: ObjectId;
  role?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export async function getUserFromRequest(
  request: Request
): Promise<SessionUser | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    console.log("[SESSION] No token found in request");
    return null;
  }
  console.log("[SESSION] Token found, verifying...");

  try {
    const payload = verifyToken(token);
    console.log("[SESSION] Token verified — userId:", payload.userId, "role:", payload.role);

    const db = await getDb();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.userId),
    });
    if (!user) {
      console.warn("[SESSION] Token valid but user not found in database — userId:", payload.userId);
      return null;
    }
    console.log("[SESSION] User loaded from database — id:", user._id.toString(), "email:", user.email);
    return { ...(user as SessionUser), id: user._id.toString() };
  } catch (error) {
    console.error("[SESSION] Token verification failed:", error);
    return null;
  }
}
