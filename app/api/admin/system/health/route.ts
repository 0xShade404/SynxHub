import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/database/prisma";
import { handleApiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

async function checkDatabase() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "OK" as const, latencyMs: Date.now() - start };
  } catch {
    return { status: "DOWN" as const, latencyMs: Date.now() - start };
  }
}

export async function GET() {
  try {
    await requireAdmin();

    const [database, pendingWithdrawals, flaggedWithdrawals, confirmingDeposits] = await Promise.all([
      checkDatabase(),
      prisma.withdrawal.count({ where: { status: { in: ["PENDING_CONFIRMATION", "APPROVED", "PROCESSING"] } } }),
      prisma.withdrawal.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.deposit.count({ where: { status: "CONFIRMING" } }),
    ]);

    return NextResponse.json({
      database,
      custodyProvider: {
        name: process.env.CUSTODY_PROVIDER ?? "mock",
        status: "OK",
        note:
          (process.env.CUSTODY_PROVIDER ?? "mock") === "mock"
            ? "Using the mock custody/signing provider — not connected to a real custodian."
            : undefined,
      },
      kycProvider: {
        name: process.env.KYC_PROVIDER ?? "mock",
        status: "OK",
        note:
          (process.env.KYC_PROVIDER ?? "mock") === "mock"
            ? "Using the mock KYC/AML provider — not a real compliance integration."
            : undefined,
      },
      queues: { pendingWithdrawals, flaggedWithdrawals, confirmingDeposits },
      demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
