import { NextResponse, type NextRequest } from "next/server";
import { verify } from "jsonwebtoken";
import { ObjectId } from "mongodb";

// Pages that require login
const authRequiredPaths = ["/admin", "/profile", "/notifications", "/family", "/directory"];
// Pages that require verified + approved (the "secret" homeschool content)
const approvedRequiredPaths = ["/events", "/calendar", "/directory", "/admin", "/profile", "/notifications", "/family", "/announcements"];
// Pages that unverified/unapproved users CAN access
const publicPaths = ["/", "/login", "/register", "/pending-approval", "/verify"];

const mutationMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function checkCsrf(request: NextRequest): boolean {
  if (!mutationMethods.has(request.method)) return true;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const requestHost = request.nextUrl.host;
  try {
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

async function getUserStatus(request: NextRequest): Promise<{ loggedIn: boolean; verified: boolean; approved: boolean; isAdmin: boolean } | null> {
  const token = request.cookies.get("authToken")?.value;
  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const payload = verify(token, secret) as { userId: string; role: string };

    // We need to check the DB for emailVerified and approved status
    // Import getDb dynamically to avoid issues
    const { getDb } = await import("@/lib/db");
    const db = await getDb();
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { emailVerified: 1, approved: 1, role: 1 } }
    );

    if (!user) return null;

    return {
      loggedIn: true,
      verified: user.emailVerified ?? false,
      approved: user.approved ?? false,
      isAdmin: user.role === "admin" || user.role === "super_admin",
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  // CSRF check for API mutations
  if (isApi && !checkCsrf(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Let API routes handle their own auth
  if (isApi) return NextResponse.next();

  // Public pages — always accessible
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
  if (isPublic) return NextResponse.next();

  // Check auth status
  const status = await getUserStatus(request);

  // Not logged in — redirect to login
  if (!status) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admins always have full access (they're pre-approved)
  if (status.isAdmin) return NextResponse.next();

  // Needs verification or approval — redirect to pending page
  const needsApproval = approvedRequiredPaths.some((path) => pathname.startsWith(path));
  if (needsApproval && (!status.verified || !status.approved)) {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/family/:path*",
    "/directory/:path*",
    "/events/:path*",
    "/calendar/:path*",
    "/announcements/:path*",
    "/api/:path*",
  ],
};
