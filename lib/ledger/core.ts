import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { InsufficientBalanceError, InvalidAmountError } from "./errors";
import type { PostLedgerEntryInput, PrismaTx } from "./types";

/**
 * The financial ledger core.
 *
 * Invariants enforced here (not in the frontend, not by convention):
 *  1. Every posting is idempotent — a caller-supplied `idempotencyKey` makes
 *     retries and webhook redelivery safe. A duplicate key returns the
 *     original entry instead of posting twice.
 *  2. The `UserAssetBalance` row for (userId, assetId) is locked with
 *     `SELECT ... FOR UPDATE` for the lifetime of the DB transaction, so
 *     concurrent postings for the same user+asset are serialized — this is
 *     what prevents race conditions and double-spends.
 *  3. A debit that would drive `balance` negative, or a reservation that
 *     would drive available balance (`balance - reservedBalance`) negative,
 *     is rejected before anything is written.
 *  4. LedgerEntry rows are never updated or deleted by application code.
 *     Corrections are new entries (typically `ADJUSTMENT`), optionally
 *     linked via `reversalOfEntryId` / `reversedByEntryId`.
 */
export async function postLedgerEntry(
  tx: PrismaTx,
  input: PostLedgerEntryInput
) {
  const amount = new Prisma.Decimal(input.amount);
  if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
    throw new InvalidAmountError();
  }

  // Idempotent replay: if this exact event was already posted, return it
  // instead of posting a duplicate.
  const existing = await tx.ledgerEntry.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    return existing;
  }

  // Ensure the balance row exists, then take a row lock for the remainder
  // of this transaction so concurrent postings serialize correctly.
  await tx.userAssetBalance.upsert({
    where: { userId_assetId: { userId: input.userId, assetId: input.assetId } },
    update: {},
    create: { userId: input.userId, assetId: input.assetId },
  });

  const locked = await tx.$queryRaw<
    { balance: Prisma.Decimal; reservedBalance: Prisma.Decimal }[]
  >(Prisma.sql`
    SELECT "balance", "reservedBalance" FROM "UserAssetBalance"
    WHERE "userId" = ${input.userId} AND "assetId" = ${input.assetId}
    FOR UPDATE
  `);
  const current = locked[0];
  if (!current) {
    throw new Error("Failed to lock balance row.");
  }

  const currentBalance = new Prisma.Decimal(current.balance);
  const currentReserved = new Prisma.Decimal(current.reservedBalance);

  let nextBalance = currentBalance;
  let nextReserved = currentReserved;
  let previousBalance = currentBalance;
  let resultingBalance = currentBalance;

  if (input.reservationEffect === "RESERVE") {
    const available = currentBalance.minus(currentReserved);
    if (available.lessThan(amount)) {
      throw new InsufficientBalanceError(
        "Requested amount exceeds available (non-reserved) balance."
      );
    }
    nextReserved = currentReserved.plus(amount);
    previousBalance = currentBalance;
    resultingBalance = currentBalance; // total balance unaffected by a reservation
  } else if (input.reservationEffect === "RELEASE") {
    if (currentReserved.lessThan(amount)) {
      throw new InsufficientBalanceError("Cannot release more than is reserved.");
    }
    nextReserved = currentReserved.minus(amount);
    previousBalance = currentBalance;
    resultingBalance = currentBalance;
  } else if (input.reservationEffect === "SETTLE") {
    // Funds actually leave custody: reduce both the reservation and the
    // total accounted balance by the same amount.
    if (currentReserved.lessThan(amount) || currentBalance.lessThan(amount)) {
      throw new InsufficientBalanceError("Cannot settle more than is reserved.");
    }
    nextReserved = currentReserved.minus(amount);
    nextBalance = currentBalance.minus(amount);
    previousBalance = currentBalance;
    resultingBalance = nextBalance;
  } else if (input.direction === "CREDIT") {
    nextBalance = currentBalance.plus(amount);
    resultingBalance = nextBalance;
  } else {
    // Direct DEBIT against the total balance (used by admin ADJUSTMENT etc.)
    if (currentBalance.lessThan(amount)) {
      throw new InsufficientBalanceError();
    }
    nextBalance = currentBalance.minus(amount);
    resultingBalance = nextBalance;
  }

  await tx.userAssetBalance.update({
    where: { userId_assetId: { userId: input.userId, assetId: input.assetId } },
    data: { balance: nextBalance, reservedBalance: nextReserved },
  });

  const entry = await tx.ledgerEntry.create({
    data: {
      userId: input.userId,
      assetId: input.assetId,
      type: input.type,
      direction: input.direction,
      amount,
      source: input.source,
      idempotencyKey: input.idempotencyKey,
      reference: input.reference,
      depositId: input.depositId,
      withdrawalId: input.withdrawalId,
      previousBalance,
      resultingBalance,
      metadata: {
        ...(input.metadata ?? {}),
        reservedBefore: currentReserved.toString(),
        reservedAfter: nextReserved.toString(),
      } as Prisma.InputJsonValue,
    },
  });

  return entry;
}

/** Convenience wrapper for callers that don't already hold a transaction. */
export async function postLedgerEntryStandalone(input: PostLedgerEntryInput) {
  return prisma.$transaction((tx) => postLedgerEntry(tx, input));
}

export async function getAvailableBalance(userId: string, assetId: string) {
  const row = await prisma.userAssetBalance.findUnique({
    where: { userId_assetId: { userId, assetId } },
  });
  if (!row) {
    return { balance: new Prisma.Decimal(0), reserved: new Prisma.Decimal(0), available: new Prisma.Decimal(0) };
  }
  const balance = new Prisma.Decimal(row.balance);
  const reserved = new Prisma.Decimal(row.reservedBalance);
  return { balance, reserved, available: balance.minus(reserved) };
}
