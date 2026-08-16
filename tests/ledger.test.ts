import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/database/prisma";
import { postLedgerEntry, getAvailableBalance } from "@/lib/ledger/core";
import { InsufficientBalanceError } from "@/lib/ledger/errors";

const runId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let userId: string;
let assetId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${runId}@example.test`, name: "Ledger Test User" },
  });
  userId = user.id;

  const asset = await prisma.asset.create({
    data: {
      symbol: `TST${runId.slice(-6).toUpperCase()}`,
      name: "Test Asset",
      network: "ethereum",
    },
  });
  assetId = asset.id;
});

afterAll(async () => {
  await prisma.ledgerEntry.deleteMany({ where: { userId } });
  await prisma.userAssetBalance.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.asset.delete({ where: { id: assetId } });
  await prisma.$disconnect();
});

describe("ledger core", () => {
  it("posts a deposit and increases the balance", async () => {
    await prisma.$transaction((tx) =>
      postLedgerEntry(tx, {
        userId,
        assetId,
        type: "DEPOSIT",
        direction: "CREDIT",
        amount: "10",
        source: "DEPOSIT_SERVICE",
        idempotencyKey: `${runId}-deposit-1`,
      })
    );

    const { balance } = await getAvailableBalance(userId, assetId);
    expect(balance.toString()).toBe("10");
  });

  it("is idempotent — replaying the same idempotency key does not double-post", async () => {
    const key = `${runId}-deposit-idempotent`;
    const post = () =>
      prisma.$transaction((tx) =>
        postLedgerEntry(tx, {
          userId,
          assetId,
          type: "DEPOSIT",
          direction: "CREDIT",
          amount: "5",
          source: "DEPOSIT_SERVICE",
          idempotencyKey: key,
        })
      );

    const before = await getAvailableBalance(userId, assetId);
    await post();
    await post();
    await post();
    const after = await getAvailableBalance(userId, assetId);

    expect(after.balance.minus(before.balance).toString()).toBe("5");

    const entries = await prisma.ledgerEntry.findMany({ where: { idempotencyKey: key } });
    expect(entries).toHaveLength(1);
  });

  it("rejects a debit that would drive the balance negative", async () => {
    const before = await getAvailableBalance(userId, assetId);

    await expect(
      prisma.$transaction((tx) =>
        postLedgerEntry(tx, {
          userId,
          assetId,
          type: "ADJUSTMENT",
          direction: "DEBIT",
          amount: before.balance.plus(1000).toString(),
          source: "ADMIN",
          idempotencyKey: `${runId}-overdraw`,
        })
      )
    ).rejects.toBeInstanceOf(InsufficientBalanceError);

    const after = await getAvailableBalance(userId, assetId);
    expect(after.balance.toString()).toBe(before.balance.toString());
  });

  it("reserves funds for a withdrawal without changing the total balance", async () => {
    const before = await getAvailableBalance(userId, assetId);

    await prisma.$transaction((tx) =>
      postLedgerEntry(tx, {
        userId,
        assetId,
        type: "WITHDRAWAL_RESERVE",
        direction: "DEBIT",
        amount: "3",
        source: "WITHDRAWAL_SERVICE",
        idempotencyKey: `${runId}-reserve-1`,
        reservationEffect: "RESERVE",
      })
    );

    const after = await getAvailableBalance(userId, assetId);
    expect(after.balance.toString()).toBe(before.balance.toString());
    expect(after.reserved.minus(before.reserved).toString()).toBe("3");
    expect(after.available.toString()).toBe(before.available.minus(3).toString());
  });

  it("rejects a reservation larger than the available (non-reserved) balance", async () => {
    const before = await getAvailableBalance(userId, assetId);

    await expect(
      prisma.$transaction((tx) =>
        postLedgerEntry(tx, {
          userId,
          assetId,
          type: "WITHDRAWAL_RESERVE",
          direction: "DEBIT",
          amount: before.available.plus(1).toString(),
          source: "WITHDRAWAL_SERVICE",
          idempotencyKey: `${runId}-reserve-overdraw`,
          reservationEffect: "RESERVE",
        })
      )
    ).rejects.toBeInstanceOf(InsufficientBalanceError);
  });

  it("releases a reservation back to available balance", async () => {
    const before = await getAvailableBalance(userId, assetId);

    await prisma.$transaction((tx) =>
      postLedgerEntry(tx, {
        userId,
        assetId,
        type: "WITHDRAWAL_RELEASE",
        direction: "CREDIT",
        amount: "3",
        source: "WITHDRAWAL_SERVICE",
        idempotencyKey: `${runId}-release-1`,
        reservationEffect: "RELEASE",
      })
    );

    const after = await getAvailableBalance(userId, assetId);
    expect(after.reserved.toString()).toBe(before.reserved.minus(3).toString());
    expect(after.available.toString()).toBe(before.available.plus(3).toString());
  });

  it("settling a withdrawal reduces both balance and reservedBalance", async () => {
    await prisma.$transaction((tx) =>
      postLedgerEntry(tx, {
        userId,
        assetId,
        type: "WITHDRAWAL_RESERVE",
        direction: "DEBIT",
        amount: "2",
        source: "WITHDRAWAL_SERVICE",
        idempotencyKey: `${runId}-reserve-2`,
        reservationEffect: "RESERVE",
      })
    );

    const before = await getAvailableBalance(userId, assetId);

    await prisma.$transaction((tx) =>
      postLedgerEntry(tx, {
        userId,
        assetId,
        type: "WITHDRAWAL",
        direction: "DEBIT",
        amount: "2",
        source: "WITHDRAWAL_SERVICE",
        idempotencyKey: `${runId}-settle-1`,
        reservationEffect: "SETTLE",
      })
    );

    const after = await getAvailableBalance(userId, assetId);
    expect(after.balance.toString()).toBe(before.balance.minus(2).toString());
    expect(after.reserved.toString()).toBe(before.reserved.minus(2).toString());
    // Available balance is unchanged by settlement — it was already
    // decremented at reservation time.
    expect(after.available.toString()).toBe(before.available.toString());
  });

  it("serializes concurrent postings for the same user+asset (no lost updates)", async () => {
    const before = await getAvailableBalance(userId, assetId);
    const concurrency = 10;

    await Promise.all(
      Array.from({ length: concurrency }, (_, i) =>
        prisma.$transaction((tx) =>
          postLedgerEntry(tx, {
            userId,
            assetId,
            type: "DEPOSIT",
            direction: "CREDIT",
            amount: "1",
            source: "DEPOSIT_SERVICE",
            idempotencyKey: `${runId}-concurrent-${i}`,
          })
        )
      )
    );

    const after = await getAvailableBalance(userId, assetId);
    expect(after.balance.minus(before.balance).toString()).toBe(String(concurrency));
  });
});
