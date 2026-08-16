"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const STATUSES = ["ACTIVE", "SUSPENDED", "RESTRICTED", "CLOSED"] as const;

export function InvestorStatusControl({ investorId, currentStatus }: { investorId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/investors/${investorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to update status.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="status" className="block text-xs font-medium">Account status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor="reason" className="block text-xs font-medium">Reason (audit log)</label>
        <input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={loading || status === currentStatus}>
        {loading ? "Saving…" : "Update status"}
      </Button>
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}
