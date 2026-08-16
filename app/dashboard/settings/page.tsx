import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/database/prisma";
import { KycPanel } from "@/components/dashboard/KycPanel";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, latestKyc] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.kycRecord.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">Account details and identity verification.</p>
      </div>

      <Card>
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 text-sm">{user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 text-sm">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Account status</dt>
            <dd className="mt-1 text-sm">{user.status}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Member since</dt>
            <dd className="mt-1 text-sm">{new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(user.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      <KycPanel status={latestKyc?.status ?? "NOT_STARTED"} />
    </div>
  );
}
