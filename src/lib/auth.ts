import bcrypt from "bcryptjs";
import { sign, verify, type Secret, type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";

function getJwtSecret(): Secret {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET environment variable.");
  }
  return jwtSecret;
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
const authCookieName = "authToken";

export interface AuthPayload {
  userId: string;
  role: string;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthPayload) {
  const options: SignOptions = {
    expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
  };
  return sign(payload, getJwtSecret(), options);
}

export function verifyToken(token: string): AuthPayload {
  return verify(token, getJwtSecret()) as AuthPayload;
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(authCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${authCookieName}=([^;]*)`));
  return match ? match[1] : null;
}
