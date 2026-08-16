"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Enrollment {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  secretBase32: string;
  encryptedSecret: string;
  recoveryCodes: string[];
  encryptedRecoveryCodes: string;
}

export function MfaSettings({ mfaEnabled }: { mfaEnabled: boolean }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  async function startEnrollment() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/security/mfa/enroll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to start MFA enrollment.");
        return;
      }
      setEnrollment(data);
      setShowRecoveryCodes(true);
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/security/mfa/enroll/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          encryptedSecret: enrollment.encryptedSecret,
          encryptedRecoveryCodes: enrollment.encryptedRecoveryCodes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      setEnrollment(null);
      setCode("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/security/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid code.");
        return;
      }
      setCode("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (mfaEnabled) {
    return (
      <Card>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
          <p className="font-medium">Multi-factor authentication is enabled</p>
          <Badge tone="success">Active</Badge>
        </div>
        <p className="mt-2 text-sm text-muted">
          A code from your authenticator app is required to request withdrawals and to
          disable MFA.
        </p>
        <form onSubmit={disableMfa} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="disable-code" className="block text-sm font-medium">
              Authentication code to disable
            </label>
            <input
              id="disable-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-40 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" variant="danger" disabled={loading || !code}>
            <ShieldOff className="h-4 w-4" /> Disable MFA
          </Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  if (enrollment) {
    return (
      <Card>
        <p className="font-medium">Scan this QR code in your authenticator app</p>
        <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
          <Image
            src={enrollment.qrCodeDataUrl}
            alt="MFA enrollment QR code"
            width={160}
            height={160}
            unoptimized
            className="rounded-md border border-border bg-white p-2"
          />
          <div>
            <p className="text-xs text-muted">Or enter this key manually:</p>
            <p className="mt-1 break-all font-mono text-sm">{enrollment.secretBase32}</p>

            {showRecoveryCodes && (
              <div className="mt-4">
                <p className="text-xs font-medium text-warning">
                  Save these recovery codes — each can be used once if you lose access to your
                  authenticator app.
                </p>
                <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
                  {enrollment.recoveryCodes.map((rc) => (
                    <li key={rc} className="rounded bg-surface px-2 py-1">{rc}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={confirmEnrollment} className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="confirm-code" className="block text-sm font-medium">
              Enter the 6-digit code to confirm
            </label>
            <input
              id="confirm-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-40 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={loading || !code}>
            Confirm & enable MFA
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEnrollment(null)}>
            Cancel
          </Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <ShieldOff className="h-5 w-5 text-muted" aria-hidden="true" />
        <p className="font-medium">Multi-factor authentication is not enabled</p>
      </div>
      <p className="mt-2 text-sm text-muted">
        MFA is required before you can request a withdrawal. We recommend enabling it now.
      </p>
      <Button className="mt-4" onClick={startEnrollment} disabled={loading}>
        {loading ? "Starting…" : "Set up MFA"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}
