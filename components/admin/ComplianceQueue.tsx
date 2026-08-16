"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface KycRow {
  id: string;
  status: string;
  riskLevel: string | null;
  country: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
}

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  NOT_STARTED: "neutral",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
};

export function ComplianceQueue({ records }: { records: KycRow[] }) {
  const router = useRouter();
  const [actioning, setActioning] = useState<string | null>(null);

  async function decide(userId: string, status: "APPROVED" | "REJECTED") {
    setActioning(userId);
    try {
      await fetch(`/api/admin/compliance/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setActioning(null);
    }
  }

  if (records.length === 0) {
    return <p className="text-sm text-muted">No KYC submissions yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs uppercase text-muted">
          <tr>
            <th scope="col" className="py-2 pr-4">Investor</th>
            <th scope="col" className="py-2 pr-4">Country</th>
            <th scope="col" className="py-2 pr-4">Risk</th>
            <th scope="col" className="py-2 pr-4">Status</th>
            <th scope="col" className="py-2 pr-4">Submitted</th>
            <th scope="col" className="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="py-3 pr-4">{r.user.name ?? r.user.email}</td>
              <td className="py-3 pr-4">{r.country ?? "—"}</td>
              <td className="py-3 pr-4">{r.riskLevel ?? "—"}</td>
              <td className="py-3 pr-4"><Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge></td>
              <td className="py-3 pr-4 text-muted">{formatDate(r.createdAt)}</td>
              <td className="py-3 pr-4">
                {r.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(r.user.id, "APPROVED")} disabled={actioning === r.user.id}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => decide(r.user.id, "REJECTED")} disabled={actioning === r.user.id}>
                      Reject
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
