import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/admin", "/profile", "/notifications"];
const mutationMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function checkCsrf(request: NextRequest): boolean {
  if (!mutationMethods.has(request.method)) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const requestHost = request.nextUrl.host;
  try {
    const originHost = new URL(origin).host;
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isApi = pathname.startsWith("/api/");

  console.log("[PROXY]", request.method, pathname, isProtected ? "(protected)" : "(public)");

  if (isApi && !checkCsrf(request)) {
    console.warn("[PROXY] CSRF check failed — origin:", request.headers.get("origin"));
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value;
  if (!token) {
    console.log("[PROXY] No authToken cookie — redirecting to /login");
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log("[PROXY] authToken present — allowing access");
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/api/:path*",
  ],
};
