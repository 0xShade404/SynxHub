import type { Metadata } from "next";
import { WithdrawalQueue } from "@/components/admin/WithdrawalQueue";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Withdrawals" };

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Withdrawals</h1>
        <p className="mt-1 text-sm text-muted">
          Review flagged withdrawals and monitor processing status across all queues.
        </p>
      </div>
      <Card>
        <WithdrawalQueue initialStatus={status} />
      </Card>
    </div>
  );
}
