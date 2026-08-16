import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/database/prisma";
import { MfaSettings } from "@/components/dashboard/MfaSettings";
import { AllowlistManager } from "@/components/dashboard/AllowlistManager";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Security" };
export const dynamic = "force-dynamic";

export default async function SecuritySettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, securityEvents, loginEvents, assets, allowlist] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { mfaEnabled: true } }),
    prisma.securityEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.loginEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.asset.findMany({ where: { enabled: true }, select: { id: true, symbol: true, network: true }, orderBy: { sortOrder: "asc" } }),
    prisma.allowlistAddress.findMany({ where: { userId }, include: { asset: { select: { symbol: true, network: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted">
          Multi-factor authentication, withdrawal address allowlisting, and recent account
          activity.
        </p>
      </div>

      <MfaSettings mfaEnabled={user.mfaEnabled} />

      <AllowlistManager assets={assets} entries={allowlist} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Security events</CardTitle>
          </CardHeader>
          {securityEvents.length === 0 ? (
            <p className="text-sm text-muted">No security events recorded.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {securityEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium">{e.type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted">{formatDate(e.createdAt)}</p>
                  </div>
                  <Badge tone={e.severity === "HIGH" || e.severity === "CRITICAL" ? "danger" : e.severity === "MEDIUM" ? "warning" : "neutral"}>
                    {e.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Login history</CardTitle>
          </CardHeader>
          {loginEvents.length === 0 ? (
            <p className="text-sm text-muted">No login history recorded.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {loginEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium">{e.method}</p>
                    <p className="text-xs text-muted">{formatDate(e.createdAt)}</p>
                  </div>
                  <Badge tone={e.success ? "success" : "danger"}>{e.success ? "Success" : "Failed"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
