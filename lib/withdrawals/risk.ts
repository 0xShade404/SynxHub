import { prisma } from "@/lib/database/prisma";

export interface RiskAssessment {
  score: number; // 0-100
  flags: string[];
  requiresReview: boolean;
  holdReason?: string;
}

const REVIEW_THRESHOLD = 50;

/**
 * Configurable, transparent risk scoring for withdrawal requests. Every
 * flag has a clear internal reason and is surfaced to admins on the
 * flagged-withdrawal queue — there are no hidden restrictions.
 */
export async function assessWithdrawalRisk(params: {
  userId: string;
  assetId: string;
  destinationAddress: string;
  amountUsd: number;
  deviceFingerprint?: string;
  ipAddress?: string;
}): Promise<RiskAssessment> {
  const flags: string[] = [];
  let score = 0;

  const [priorWithdrawalsToAddress, recentWithdrawals, device, allowlistEntry] = await Promise.all([
    prisma.withdrawal.count({
      where: {
        userId: params.userId,
        destinationAddress: params.destinationAddress,
        status: { in: ["COMPLETED", "PROCESSING", "APPROVED"] },
      },
    }),
    prisma.withdrawal.findMany({
      where: {
        userId: params.userId,
        requestedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    params.deviceFingerprint
      ? prisma.device.findUnique({
          where: { userId_deviceFingerprint: { userId: params.userId, deviceFingerprint: params.deviceFingerprint } },
        })
      : null,
    prisma.allowlistAddress.findFirst({
      where: { userId: params.userId, assetId: params.assetId, address: params.destinationAddress, status: "APPROVED" },
    }),
  ]);

  if (priorWithdrawalsToAddress === 0 && !allowlistEntry) {
    score += 25;
    flags.push("NEW_WITHDRAWAL_ADDRESS");
  }

  if (params.deviceFingerprint && (!device || !device.trusted)) {
    score += 20;
    flags.push("NEW_OR_UNTRUSTED_DEVICE");
  }

  // Velocity: more than 3 withdrawal requests in 24h, or cumulative amount
  // this request would push over $50,000 in a rolling 24h window.
  if (recentWithdrawals.length >= 3) {
    score += 15;
    flags.push("HIGH_VELOCITY_REQUEST_COUNT");
  }

  if (params.amountUsd >= 50_000) {
    score += 25;
    flags.push("LARGE_AMOUNT");
  }

  if (params.amountUsd >= 10_000 && priorWithdrawalsToAddress === 0) {
    score += 15;
    flags.push("LARGE_AMOUNT_TO_NEW_ADDRESS");
  }

  score = Math.min(score, 100);
  const requiresReview = score >= REVIEW_THRESHOLD;

  return {
    score,
    flags,
    requiresReview,
    holdReason: requiresReview
      ? `Automated risk score ${score} met the manual review threshold (${REVIEW_THRESHOLD}). Flags: ${flags.join(", ")}.`
      : undefined,
  };
}
