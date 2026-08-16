import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/database/prisma";
import { TransactionsList } from "@/components/dashboard/TransactionsList";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Transactions" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function TransactionsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const entries = await prisma.ledgerEntry.findMany({
    where: { userId },
    include: { asset: { select: { symbol: true } } },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  });

  const hasMore = entries.length > PAGE_SIZE;
  const page = hasMore ? entries.slice(0, PAGE_SIZE) : entries;

  const serialized = page.map((e) => ({
    id: e.id,
    type: e.type,
    direction: e.direction,
    amount: e.amount.toString(),
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    reference: e.reference,
    asset: e.asset,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-muted">
          The full, immutable history of every ledger event on your account.
        </p>
      </div>

      <Card>
        <TransactionsList
          initialTransactions={serialized}
          initialCursor={hasMore ? page[page.length - 1]?.id ?? null : null}
        />
      </Card>
    </div>
  );
}
