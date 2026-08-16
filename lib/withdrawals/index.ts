import { prisma } from "@/lib/database/prisma";
import { postLedgerEntry } from "@/lib/ledger/core";
import { getAvailableBalance } from "@/lib/ledger/core";
import { InsufficientBalanceError, InvalidAmountError } from "@/lib/ledger/errors";
import { getAssetPrice } from "@/lib/pricing/provider";
import { assessWithdrawalRisk } from "./risk";
import { getSigningProvider } from "./provider";
import { isValidAddressForNetwork } from "@/lib/validation/address";
import { recordAuditLog, recordSecurityEvent } from "@/lib/security/audit";
import { Prisma } from "@prisma/client";

export class WithdrawalValidationError extends Error {}

export interface RequestWithdrawalParams {
  userId: string;
  assetId: string;
  destinationAddress: string;
  amount: string;
  idempotencyKey: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  mfaVerified: boolean;
}

// Zero SynxHub platform fee, by design — see docs/WITHDRAWAL_POLICY.md.
export const PLATFORM_WITHDRAWAL_FEE = 0;

export async function requestWithdrawal(params: RequestWithdrawalParams) {
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: params.assetId } });
  if (!asset.enabled || !asset.withdrawalEnabled) {
    throw new WithdrawalValidationError("Withdrawals are currently disabled for this asset.");
  }

  if (!isValidAddressForNetwork(params.destinationAddress, asset.network)) {
    throw new WithdrawalValidationError("Destination address is not valid for this network.");
  }

  const amount = new Prisma.Decimal(params.amount);
  if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
    throw new InvalidAmountError();
  }

  if (!params.mfaVerified) {
    throw new WithdrawalValidationError("MFA confirmation is required before submitting a withdrawal.");
  }

  const { available } = await getAvailableBalance(params.userId, params.assetId);
  if (available.lessThan(amount)) {
    throw new InsufficientBalanceError("Requested amount exceeds your available withdrawal balance.");
  }

  const price = await getAssetPrice(params.assetId);
  const amountUsd = Number(amount) * (price?.priceUsd ?? 0);

  const risk = await assessWithdrawalRisk({
    userId: params.userId,
    assetId: params.assetId,
    destinationAddress: params.destinationAddress,
    amountUsd,
    deviceFingerprint: params.deviceFingerprint,
    ipAddress: params.ipAddress,
  });

  // Network/third-party processing cost is estimated and shown separately
  // from the (always-zero) SynxHub platform fee — see the withdrawal UI.
  const networkFeeEstimate = new Prisma.Decimal(0);
  const expectedNetAmount = amount.minus(networkFeeEstimate);

  const initialStatus = risk.requiresReview ? "PENDING_REVIEW" : "APPROVED";

  const withdrawal = await prisma.$transaction(async (tx) => {
    const created = await tx.withdrawal.create({
      data: {
        userId: params.userId,
        assetId: params.assetId,
        network: asset.network,
        destinationAddress: params.destinationAddress,
        amount,
        networkFeeEstimate,
        expectedNetAmount,
        status: initialStatus,
        riskScore: risk.score,
        riskFlags: risk.flags as unknown as Prisma.InputJsonValue,
        holdReason: risk.holdReason,
        mfaVerifiedAt: new Date(),
        idempotencyKey: params.idempotencyKey,
      },
    });

    await postLedgerEntry(tx, {
      userId: params.userId,
      assetId: params.assetId,
      type: "WITHDRAWAL_RESERVE",
      direction: "DEBIT",
      amount,
      source: "WITHDRAWAL_SERVICE",
      idempotencyKey: `withdrawal-reserve:${created.id}`,
      withdrawalId: created.id,
      reservationEffect: "RESERVE",
      metadata: { destinationAddress: params.destinationAddress, riskScore: risk.score },
    });

    return created;
  });

  if (risk.flags.includes("NEW_WITHDRAWAL_ADDRESS")) {
    await recordSecurityEvent({
      userId: params.userId,
      type: "NEW_WITHDRAWAL_ADDRESS",
      severity: "MEDIUM",
      metadata: { withdrawalId: withdrawal.id, destinationAddress: params.destinationAddress },
    });
  }

  if (risk.requiresReview) {
    await recordSecurityEvent({
      userId: params.userId,
      type: "WITHDRAWAL_HOLD",
      severity: "HIGH",
      metadata: { withdrawalId: withdrawal.id, riskScore: risk.score, flags: risk.flags },
    });
    return withdrawal;
  }

  return processWithdrawal(withdrawal.id);
}

/** Submits an approved withdrawal to the custody/signing provider. */
export async function processWithdrawal(withdrawalId: string) {
  const withdrawal = await prisma.withdrawal.findUniqueOrThrow({
    where: { id: withdrawalId },
    include: { asset: true },
  });

  if (!["APPROVED"].includes(withdrawal.status)) {
    throw new WithdrawalValidationError(
      `Withdrawal must be APPROVED to process (current status: ${withdrawal.status}).`
    );
  }

  await prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: "PROCESSING" } });

  try {
    const signer = getSigningProvider();
    const { txHash } = await signer.submitWithdrawal({
      withdrawalId: withdrawal.id,
      assetSymbol: withdrawal.asset.symbol,
      network: withdrawal.network,
      destinationAddress: withdrawal.destinationAddress,
      amount: withdrawal.amount.toString(),
    });

    const price = await getAssetPrice(withdrawal.assetId);
    const usdValueAtPosting = Number(withdrawal.amount) * (price?.priceUsd ?? 0);

    const result = await prisma.$transaction(async (tx) => {
      await postLedgerEntry(tx, {
        userId: withdrawal.userId,
        assetId: withdrawal.assetId,
        type: "WITHDRAWAL",
        direction: "DEBIT",
        amount: withdrawal.amount,
        source: "WITHDRAWAL_SERVICE",
        idempotencyKey: `withdrawal-settle:${withdrawal.id}`,
        withdrawalId: withdrawal.id,
        reservationEffect: "SETTLE",
        metadata: { txHash, usdValueAtPosting, priceUsd: price?.priceUsd ?? 0 },
      });

      return tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "COMPLETED", txHash, processedAt: new Date() },
      });
    });

    return result;
  } catch (err) {
    await failWithdrawal(withdrawal.id, err instanceof Error ? err.message : "Unknown error");
    throw err;
  }
}

export async function failWithdrawal(withdrawalId: string, reason: string) {
  const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });

  return prisma.$transaction(async (tx) => {
    await postLedgerEntry(tx, {
      userId: withdrawal.userId,
      assetId: withdrawal.assetId,
      type: "WITHDRAWAL_RELEASE",
      direction: "CREDIT",
      amount: withdrawal.amount,
      source: "WITHDRAWAL_SERVICE",
      idempotencyKey: `withdrawal-release:${withdrawal.id}`,
      withdrawalId: withdrawal.id,
      reservationEffect: "RELEASE",
      metadata: { reason },
    });

    return tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: "FAILED", failureReason: reason, processedAt: new Date() },
    });
  });
}

export async function reviewWithdrawal(params: {
  withdrawalId: string;
  adminUserId: string;
  decision: "APPROVE" | "REJECT";
  note?: string;
  ipAddress?: string;
}) {
  const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: params.withdrawalId } });
  if (withdrawal.status !== "PENDING_REVIEW" && withdrawal.status !== "ON_HOLD") {
    throw new WithdrawalValidationError(`Withdrawal is not awaiting review (status: ${withdrawal.status}).`);
  }

  await prisma.withdrawal.update({
    where: { id: withdrawal.id },
    data: {
      reviewedAt: new Date(),
      reviewedByUserId: params.adminUserId,
      status: params.decision === "APPROVE" ? "APPROVED" : "REJECTED",
    },
  });

  await recordAuditLog({
    actorUserId: params.adminUserId,
    actorRole: "ADMIN",
    action: params.decision === "APPROVE" ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
    targetType: "Withdrawal",
    targetId: withdrawal.id,
    metadata: { note: params.note },
    ipAddress: params.ipAddress,
  });

  if (params.decision === "REJECT") {
    return failWithdrawal(withdrawal.id, params.note ?? "Rejected during admin review.");
  }

  return processWithdrawal(withdrawal.id);
}

export async function listWithdrawals(userId: string) {
  return prisma.withdrawal.findMany({
    where: { userId },
    include: { asset: true },
    orderBy: { requestedAt: "desc" },
  });
}
