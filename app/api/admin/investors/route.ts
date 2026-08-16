import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const q = request.nextUrl.searchParams.get("q")?.trim();

    const investors = await prisma.user.findMany({
      where: {
        role: "INVESTOR",
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { id: q },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        country: true,
        mfaEnabled: true,
        createdAt: true,
        kycRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ investors });
  } catch (error) {
    return handleApiError(error);
  }
}
