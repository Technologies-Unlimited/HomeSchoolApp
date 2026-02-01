import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Missing JWT_SECRET environment variable.");
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
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, jwtSecret) as AuthPayload;
}

export function setAuthCookie(token: string) {
  cookies().set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function clearAuthCookie() {
  cookies().set(authCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieToken =
    ("cookies" in request && request.cookies.get(authCookieName)?.value) ||
    cookies().get(authCookieName)?.value;
  return cookieToken ?? null;
}
