/**
 * Seeds the local/demo database with:
 *  - an admin and a demo investor account (dev-credentials login only)
 *  - the eight-asset demo L1 universe, clearly marked as DEMO DATA
 *  - a restricted-jurisdiction sample list
 *  - a short illustrative ledger history for the demo investor
 *
 * This script talks to Prisma directly (no "@/..." aliases) so it can run
 * standalone via `tsx` without depending on the Next.js module resolver.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_ASSETS = [
  { symbol: "BTC", name: "Bitcoin", network: "bitcoin", priceUsd: "64250.32", allocationBps: 2500 },
  { symbol: "ETH", name: "Ethereum", network: "ethereum", priceUsd: "3125.87", allocationBps: 2000 },
  { symbol: "SOL", name: "Solana", network: "solana", priceUsd: "148.62", allocationBps: 1500 },
  { symbol: "AVAX", name: "Avalanche", network: "avalanche", priceUsd: "27.41", allocationBps: 1000 },
  { symbol: "ATOM", name: "Cosmos", network: "cosmos", priceUsd: "6.85", allocationBps: 1000 },
  { symbol: "DOT", name: "Polkadot", network: "polkadot", priceUsd: "5.12", allocationBps: 900 },
  { symbol: "NEAR", name: "NEAR Protocol", network: "near", priceUsd: "4.38", allocationBps: 600 },
  { symbol: "SUI", name: "Sui", network: "sui", priceUsd: "1.92", allocationBps: 500 },
];

async function main() {
  console.log("Seeding SynxHub demo data...");

  const adminPasswordHash = await bcrypt.hash("AdminDemo123!", 12);
  const investorPasswordHash = await bcrypt.hash("InvestorDemo123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@synxhub.demo" },
    update: {},
    create: {
      email: "admin@synxhub.demo",
      name: "SynxHub Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash: adminPasswordHash,
      emailVerified: new Date(),
    },
  });

  const investor = await prisma.user.upsert({
    where: { email: "investor@synxhub.demo" },
    update: {},
    create: {
      email: "investor@synxhub.demo",
      name: "Demo Investor",
      role: "INVESTOR",
      status: "ACTIVE",
      country: "US",
      passwordHash: investorPasswordHash,
      emailVerified: new Date(),
    },
  });

  await prisma.kycRecord.upsert({
    where: { id: `${investor.id}-kyc-seed` },
    update: {},
    create: {
      id: `${investor.id}-kyc-seed`,
      userId: investor.id,
      provider: "mock-kyc",
      status: "APPROVED",
      riskLevel: "LOW",
      country: "US",
      submittedAt: new Date(),
      reviewedAt: new Date(),
      externalReferenceId: "mock_kyc_seed",
    },
  });

  const assets: Awaited<ReturnType<typeof prisma.asset.upsert>>[] = [];
  for (const [index, a] of DEMO_ASSETS.entries()) {
    const asset = await prisma.asset.upsert({
      where: { symbol: a.symbol },
      update: {
        currentPriceUsd: a.priceUsd,
        targetAllocationBps: a.allocationBps,
      },
      create: {
        symbol: a.symbol,
        name: a.name,
        network: a.network,
        decimals: 18,
        targetAllocationBps: a.allocationBps,
        sortOrder: index,
        enabled: true,
        depositEnabled: true,
        withdrawalEnabled: true,
        tradingEnabled: true,
        currentPriceUsd: a.priceUsd,
        priceSource: "DEMO_FIXTURE",
        isDemoData: true,
        requiredConfirmations: 12,
      },
    });
    assets.push(asset);
  }

  for (const code of ["KP", "IR", "SY", "CU"]) {
    await prisma.restrictedJurisdiction.upsert({
      where: { countryCode: code },
      update: {},
      create: { countryCode: code, reason: "Comprehensive sanctions program.", enabled: true },
    });
  }

  // --- Illustrative ledger history for the demo investor -------------------
  const btc = assets.find((a) => a.symbol === "BTC")!;
  const eth = assets.find((a) => a.symbol === "ETH")!;
  const sol = assets.find((a) => a.symbol === "SOL")!;

  const seedLedger = async (
    assetId: string,
    priceUsd: number,
    amount: string,
    daysAgo: number,
    idKey: string
  ) => {
    const existing = await prisma.ledgerEntry.findUnique({ where: { idempotencyKey: idKey } });
    if (existing) return;

    const balanceRow = await prisma.userAssetBalance.upsert({
      where: { userId_assetId: { userId: investor.id, assetId } },
      update: {},
      create: { userId: investor.id, assetId },
    });

    const amountDec = new Prisma.Decimal(amount);
    const previousBalance = new Prisma.Decimal(balanceRow.balance);
    const resultingBalance = previousBalance.plus(amountDec);

    await prisma.userAssetBalance.update({
      where: { userId_assetId: { userId: investor.id, assetId } },
      data: { balance: resultingBalance },
    });

    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const asset = assets.find((a) => a.id === assetId)!;

    const depositAddress = await prisma.depositAddress.upsert({
      where: { userId_assetId: { userId: investor.id, assetId } },
      update: {},
      create: {
        userId: investor.id,
        assetId,
        network: asset.network,
        address: `demo1${idKey}`,
        provider: "mock-custody",
      },
    });

    const deposit = await prisma.deposit.create({
      data: {
        userId: investor.id,
        assetId,
        depositAddressId: depositAddress.id,
        network: asset.network,
        amount: amountDec,
        txHash: `demo_tx_${idKey}`,
        confirmations: asset.requiredConfirmations,
        requiredConfirmations: asset.requiredConfirmations,
        status: "COMPLETED",
        idempotencyKey: `deposit-observed:demo_tx_${idKey}`,
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        userId: investor.id,
        assetId,
        type: "DEPOSIT",
        direction: "CREDIT",
        amount: amountDec,
        source: "DEPOSIT_SERVICE",
        idempotencyKey: idKey,
        reference: deposit.txHash,
        depositId: deposit.id,
        previousBalance,
        resultingBalance,
        createdAt,
        metadata: { usdValueAtPosting: Number(amount) * priceUsd, priceUsd, isDemoData: true, seed: true },
      },
    });
  };

  await seedLedger(btc.id, 58210, "0.42", 90, "seed-deposit-btc-1");
  await seedLedger(eth.id, 2870, "3.1", 60, "seed-deposit-eth-1");
  await seedLedger(sol.id, 121, "18.5", 30, "seed-deposit-sol-1");
  await seedLedger(btc.id, 61340, "0.15", 10, "seed-deposit-btc-2");

  console.log("Seed complete.");
  console.log(`Admin login:    admin@synxhub.demo / AdminDemo123!`);
  console.log(`Investor login: investor@synxhub.demo / InvestorDemo123!`);
  console.log(`Admin id: ${admin.id}, Investor id: ${investor.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
