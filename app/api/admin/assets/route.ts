import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const assets = await prisma.asset.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ assets });
  } catch (error) {
    return handleApiError(error);
  }
}
