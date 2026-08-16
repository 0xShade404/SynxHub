import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guards";
import { simulateDeposit } from "@/lib/deposits";
import { simulateDepositSchema } from "@/lib/validation/schemas";
import { handleApiError, jsonError } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/security/origin";

/**
 * Development/demo-only endpoint that simulates a fully-confirmed deposit
 * without a real custody provider, so the deposit flow and ledger can be
 * exercised end-to-end locally. Hard-disabled outside development.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Not found.", 404);
  }
  try {
    if (!assertSameOrigin(request)) return jsonError("Invalid request origin.", 403);
    const user = await requireUser();
    const body = simulateDepositSchema.parse(await request.json());
    const deposit = await simulateDeposit({ userId: user.id, assetId: body.assetId, amount: body.amount });
    return NextResponse.json({ deposit });
  } catch (error) {
    return handleApiError(error);
  }
}
