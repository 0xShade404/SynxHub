import { z } from "zod";

export const timeframeSchema = z.enum(["24H", "7D", "30D", "90D", "1Y", "ALL"]);

export const depositAddressRequestSchema = z.object({
  assetId: z.string().min(1),
});

export const simulateDepositSchema = z.object({
  assetId: z.string().min(1),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Amount must be a positive decimal number.")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero."),
});

export const withdrawalRequestSchema = z.object({
  assetId: z.string().min(1),
  destinationAddress: z.string().min(10).max(120),
  amount: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "Amount must be a positive decimal number.")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero."),
  mfaCode: z.string().min(6).max(10),
  idempotencyKey: z.string().uuid(),
});

export const withdrawalReviewSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(1000).optional(),
});

export const mfaEnrollConfirmSchema = z.object({
  code: z.string().min(6).max(10),
});

export const allowlistAddressSchema = z.object({
  assetId: z.string().min(1),
  address: z.string().min(10).max(120),
  label: z.string().max(80).optional(),
});

export const adminAssetUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  depositEnabled: z.boolean().optional(),
  withdrawalEnabled: z.boolean().optional(),
  tradingEnabled: z.boolean().optional(),
  targetAllocationBps: z.number().int().min(0).max(10000).optional(),
  currentPriceUsd: z.number().positive().optional(),
});

export const adminInvestorStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "RESTRICTED", "CLOSED"]),
  reason: z.string().max(500).optional(),
});

export const kycSubmitSchema = z.object({
  fullName: z.string().min(2).max(120),
  country: z.string().length(2),
  dateOfBirth: z.string().min(8).max(10),
});
