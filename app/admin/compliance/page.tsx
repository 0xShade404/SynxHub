import type { Metadata } from "next";
import { prisma } from "@/lib/database/prisma";
import { ComplianceQueue } from "@/components/admin/ComplianceQueue";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

export default async function AdminCompliancePage() {
  const [kycRecords, restrictedJurisdictions] = await Promise.all([
    prisma.kycRecord.findMany({
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.restrictedJurisdiction.findMany({ orderBy: { countryCode: "asc" } }),
  ]);

  const serialized = kycRecords.map((r) => ({
    id: r.id,
    status: r.status,
    riskLevel: r.riskLevel,
    country: r.country,
    createdAt: r.createdAt.toISOString(),
    user: r.user,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compliance</h1>
        <p className="mt-1 text-sm text-muted">KYC/AML status, sanctions screening, and restricted jurisdictions.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>KYC queue</CardTitle></CardHeader>
        <ComplianceQueue records={serialized} />
      </Card>

      <Card>
        <CardHeader><CardTitle>Restricted jurisdictions</CardTitle></CardHeader>
        <div className="flex flex-wrap gap-2">
          {restrictedJurisdictions.map((j) => (
            <Badge key={j.id} tone="danger">{j.countryCode}</Badge>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Managed via the RestrictedJurisdiction table. Investors from these jurisdictions are
          blocked at KYC submission (see lib/compliance/provider.ts).
        </p>
      </Card>
    </div>
  );
}
