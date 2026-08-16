import { prisma } from "@/lib/database/prisma";
import { getCustodyDepositProvider } from "./provider";
import { postLedgerEntry } from "@/lib/ledger/core";
import { getAssetPrice } from "@/lib/pricing/provider";
import { recordAuditLog } from "@/lib/security/audit";
import crypto from "crypto";

export async function getOrCreateDepositAddress(userId: string, assetId: string) {
  const existing = await prisma.depositAddress.findUnique({
    where: { userId_assetId: { userId, assetId } },
  });
  if (existing) return existing;

  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: assetId } });
  if (!asset.enabled || !asset.depositEnabled) {
    throw new Error("Deposits are currently disabled for this asset.");
  }

  const provider = getCustodyDepositProvider();
  const { address, provider: providerName } = await provider.generateDepositAddress({
    userId,
    assetSymbol: asset.symbol,
    network: asset.network,
  });

  return prisma.depositAddress.create({
    data: { userId, assetId, network: asset.network, address, provider: providerName },
  });
}

export async function listDeposits(userId: string) {
  return prisma.deposit.findMany({
    where: { userId },
    include: { asset: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Records an inbound on-chain transaction observed by the custody
 * provider's monitoring/webhook and begins confirmation tracking. In
 * production this is invoked from a signed custody-provider webhook
 * handler — never triggered directly by client input.
 */
export async function recordObservedDeposit(params: {
  userId: string;
  assetId: string;
  amount: string;
  txHash: string;
}) {
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: params.assetId } });
  const depositAddress = await prisma.depositAddress.findUniqueOrThrow({
    where: { userId_assetId: { userId: params.userId, assetId: params.assetId } },
  });

  const idempotencyKey = `deposit-observed:${params.txHash}`;
  const existing = await prisma.deposit.findFirst({ where: { txHash: params.txHash } });
  if (existing) return existing;

  return prisma.deposit.create({
    data: {
      userId: params.userId,
      assetId: params.assetId,
      depositAddressId: depositAddress.id,
      network: asset.network,
      amount: params.amount,
      txHash: params.txHash,
      confirmations: 0,
      requiredConfirmations: asset.requiredConfirmations,
      status: "CONFIRMING",
      idempotencyKey,
    },
  });
}

export async function advanceDepositConfirmations(depositId: string, confirmations: number) {
  const deposit = await prisma.deposit.findUniqueOrThrow({
    where: { id: depositId },
    include: { asset: true },
  });

  if (deposit.status === "COMPLETED" || deposit.status === "FAILED") {
    return deposit;
  }

  if (confirmations < deposit.requiredConfirmations) {
    return prisma.deposit.update({
      where: { id: depositId },
      data: { confirmations, status: "CONFIRMING" },
    });
  }

  // Reached required confirmations — post to the ledger atomically with the
  // deposit status transition so a crash can't leave one without the other.
  const price = await getAssetPrice(deposit.assetId);
  const amount = deposit.amount ?? 0;
  const usdValueAtPosting = Number(amount) * (price?.priceUsd ?? 0);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.deposit.update({
      where: { id: depositId },
      data: { confirmations, status: "COMPLETED" },
    });

    const entry = await postLedgerEntry(tx, {
      userId: deposit.userId,
      assetId: deposit.assetId,
      type: "DEPOSIT",
      direction: "CREDIT",
      amount: amount.toString(),
      source: "DEPOSIT_SERVICE",
      idempotencyKey: `deposit-ledger:${deposit.id}`,
      reference: deposit.txHash ?? undefined,
      depositId: deposit.id,
      metadata: {
        usdValueAtPosting,
        priceUsd: price?.priceUsd ?? 0,
        isDemoData: price?.isDemoData ?? true,
        txHash: deposit.txHash,
      },
    });

    return { updated, entry };
  });

  await recordAuditLog({
    action: "DEPOSIT_COMPLETED",
    targetType: "Deposit",
    targetId: deposit.id,
    metadata: { userId: deposit.userId, amount: amount.toString(), usdValueAtPosting },
  });

  return result.updated;
}

/**
 * Development-only helper that simulates a fully-confirmed deposit without
 * a real custody provider. Never exposed outside a dev/demo environment —
 * see app/api/dev/deposits/simulate for the guarded route.
 */
export async function simulateDeposit(params: {
  userId: string;
  assetId: string;
  amount: string;
}) {
  const fakeTxHash = `demo_tx_${crypto.randomBytes(12).toString("hex")}`;
  await getOrCreateDepositAddress(params.userId, params.assetId);
  const deposit = await recordObservedDeposit({
    userId: params.userId,
    assetId: params.assetId,
    amount: params.amount,
    txHash: fakeTxHash,
  });
  const asset = await prisma.asset.findUniqueOrThrow({ where: { id: params.assetId } });
  return advanceDepositConfirmations(deposit.id, asset.requiredConfirmations);
}
