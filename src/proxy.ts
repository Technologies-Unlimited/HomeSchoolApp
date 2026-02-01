import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = ["/admin", "/profile", "/notifications"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("authToken")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/notifications/:path*"],
};
