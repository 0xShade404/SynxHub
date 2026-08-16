"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  NOT_STARTED: "neutral",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
};

export function KycPanel({ status }: { status: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, country: country.toUpperCase(), dateOfBirth }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to submit verification.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Identity verification (KYC)</h2>
        <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ")}</Badge>
      </div>

      {status === "APPROVED" ? (
        <p className="mt-2 text-sm text-muted">Your identity has been verified.</p>
      ) : status === "PENDING" ? (
        <p className="mt-2 text-sm text-muted">Your verification is being reviewed.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Required before deposits are enabled. Processed via SynxHub&apos;s KYC/AML
            provider integration (mock provider in this environment).
          </p>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="kyc-name" className="block text-xs font-medium">Full legal name</label>
              <input
                id="kyc-name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="kyc-country" className="block text-xs font-medium">Country (ISO 2-letter)</label>
              <input
                id="kyc-country"
                required
                maxLength={2}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="US"
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm uppercase"
              />
            </div>
            <div>
              <label htmlFor="kyc-dob" className="block text-xs font-medium">Date of birth</label>
              <input
                id="kyc-dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Submitting…" : "Submit verification"}
              </Button>
            </div>
          </form>
        </>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
