import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { getPortfolioSummary, getPerformanceSeries } from "@/lib/portfolio";
import { timeframeSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const timeframeParam = request.nextUrl.searchParams.get("timeframe") ?? "30D";
    const timeframe = timeframeSchema.parse(timeframeParam);

    const [summary, performance] = await Promise.all([
      getPortfolioSummary(user.id),
      getPerformanceSeries(user.id, timeframe),
    ]);

    return NextResponse.json({ summary, performance, timeframe });
  } catch (error) {
    return handleApiError(error);
  }
}
