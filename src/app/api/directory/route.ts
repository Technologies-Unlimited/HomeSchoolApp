import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUserFromRequest } from "@/lib/session";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { limit, skip } = parsePagination(request.url);
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get("search")?.trim() ?? "";

  const db = await getDb();

  const filter: Record<string, unknown> = { directoryOptIn: true };

  if (searchQuery) {
    const escapedSearch = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { firstName: { $regex: escapedSearch, $options: "i" } },
      { lastName: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const [families, totalCount] = await Promise.all([
    db
      .collection("users")
      .find(filter)
      .sort({ lastName: 1, firstName: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("users").countDocuments(filter),
  ]);

  // Join children from families collection
  const userIds = families.map((f) => f._id);
  const familyDocs = userIds.length > 0
    ? await db.collection("families").find({
        $or: [{ userId: { $in: userIds } }, { linkedUserIds: { $in: userIds } }],
      }).toArray()
    : [];

  const familyByUser = new Map<string, Record<string, unknown>>();
  for (const fam of familyDocs) {
    const ownerKey = fam.userId.toString();
    if (!familyByUser.has(ownerKey)) familyByUser.set(ownerKey, fam);
    for (const linked of fam.linkedUserIds ?? []) {
      const key = linked.toString();
      if (!familyByUser.has(key)) familyByUser.set(key, fam);
    }
  }

  const directoryEntries = families.map((family) => {
    const fam = familyByUser.get(family._id.toString());
    const children = ((fam?.children ?? []) as { firstName: string; lastName: string; dateOfBirth?: string }[]).map((child) => ({
      firstName: child.firstName,
      age: child.dateOfBirth ? Math.floor((Date.now() - new Date(child.dateOfBirth).getTime()) / 31557600000) : undefined,
    }));

    return {
      id: family._id.toString(),
      firstName: family.firstName ?? "",
      lastName: family.lastName ?? "",
      email: family.shareEmail ? (family.email ?? null) : null,
      phone: family.sharePhone ? (family.phone ?? null) : null,
      children,
    };
  });

  return NextResponse.json({
    families: directoryEntries,
    total: totalCount,
  });
}
