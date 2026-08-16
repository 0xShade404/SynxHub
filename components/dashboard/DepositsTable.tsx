import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCrypto, truncateAddress } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/blockchain/explorers";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  AWAITING_FUNDS: "neutral",
  CONFIRMING: "warning",
  COMPLETED: "success",
  FAILED: "danger",
};

interface DepositRow {
  id: string;
  network: string;
  amount: { toString(): string } | null;
  txHash: string | null;
  confirmations: number;
  requiredConfirmations: number;
  status: string;
  createdAt: string | Date;
  asset: { symbol: string };
}

export function DepositsTable({ deposits }: { deposits: DepositRow[] }) {
  if (deposits.length === 0) {
    return <p className="text-sm text-muted">No deposits yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs uppercase text-muted">
          <tr>
            <th scope="col" className="py-2 pr-4">Asset</th>
            <th scope="col" className="py-2 pr-4">Amount</th>
            <th scope="col" className="py-2 pr-4">Confirmations</th>
            <th scope="col" className="py-2 pr-4">Status</th>
            <th scope="col" className="py-2 pr-4">Transaction</th>
            <th scope="col" className="py-2 pr-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((d) => {
            const explorerUrl = d.txHash ? getExplorerTxUrl(d.network, d.txHash) : null;
            return (
              <tr key={d.id} className="border-t border-border">
                <td className="py-3 pr-4 font-medium">{d.asset.symbol}</td>
                <td className="py-3 pr-4 tabular-nums">
                  {d.amount ? formatCrypto(Number(d.amount), d.asset.symbol) : "—"}
                </td>
                <td className="py-3 pr-4 tabular-nums">
                  {d.confirmations}/{d.requiredConfirmations}
                </td>
                <td className="py-3 pr-4">
                  <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="py-3 pr-4">
                  {d.txHash ? (
                    explorerUrl ? (
                      <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        {truncateAddress(d.txHash)}
                      </a>
                    ) : (
                      <span className="font-mono text-xs">{truncateAddress(d.txHash)}</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 pr-4 text-muted">{formatDate(d.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
