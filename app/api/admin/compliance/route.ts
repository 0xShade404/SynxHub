import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN", "COMPLIANCE"]);
    const [kycRecords, restrictedJurisdictions] = await Promise.all([
      prisma.kycRecord.findMany({
        include: { user: { select: { id: true, email: true, name: true, country: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.restrictedJurisdiction.findMany({ orderBy: { countryCode: "asc" } }),
    ]);
    return NextResponse.json({ kycRecords, restrictedJurisdictions });
  } catch (error) {
    return handleApiError(error);
  }
}
