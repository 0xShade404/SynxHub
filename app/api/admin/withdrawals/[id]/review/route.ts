import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { reviewWithdrawal } from "@/lib/withdrawals";
import { withdrawalReviewSchema } from "@/lib/validation/schemas";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const admin = await requireAdmin();
    const { id } = await params;
    const body = withdrawalReviewSchema.parse(await request.json());

    const forwardedFor = request.headers.get("x-forwarded-for");
    const withdrawal = await reviewWithdrawal({
      withdrawalId: id,
      adminUserId: admin.id,
      decision: body.decision,
      note: body.note,
      ipAddress: forwardedFor?.split(",")[0]?.trim(),
    });

    return NextResponse.json({ withdrawal });
  } catch (error) {
    return handleApiError(error);
  }
}
