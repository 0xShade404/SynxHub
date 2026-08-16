import type { LedgerDirection, LedgerEntryType, LedgerSource, Prisma } from "@prisma/client";

export type PrismaTx = Prisma.TransactionClient;

export interface PostLedgerEntryInput {
  userId: string;
  assetId: string;
  type: LedgerEntryType;
  direction: LedgerDirection;
  /** Always a positive amount; `direction` determines the sign of the effect. */
  amount: Prisma.Decimal | string | number;
  source: LedgerSource;
  /**
   * Unique per logical financial event. Required — this is what makes
   * posting safe to retry (replay protection / duplicate prevention).
   */
  idempotencyKey: string;
  reference?: string;
  depositId?: string;
  withdrawalId?: string;
  metadata?: Record<string, unknown>;
  /**
   * Entry types that only move funds between `balance` and
   * `reservedBalance` (withdrawal holds) rather than changing the total
   * ledger-accounted balance.
   */
  reservationEffect?: "RESERVE" | "RELEASE" | "SETTLE";
}

export const BALANCE_AFFECTING_TYPES: LedgerEntryType[] = [
  "DEPOSIT",
  "ALLOCATION",
  "REBALANCE",
  "TRADE",
  "NETWORK_FEE",
  "PLATFORM_FEE",
  "PROFIT_LOSS",
  "ADJUSTMENT",
  "WITHDRAWAL",
];
