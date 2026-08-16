import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") ?? undefined;
    const take = Math.min(Number(searchParams.get("take") ?? 25), 100);

    const entries = await prisma.ledgerEntry.findMany({
      where: { userId: user.id },
      include: { asset: { select: { symbol: true, name: true, network: true } } },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = entries.length > take;
    const page = hasMore ? entries.slice(0, take) : entries;

    return NextResponse.json({
      transactions: page,
      nextCursor: hasMore ? page[page.length - 1]?.id : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
