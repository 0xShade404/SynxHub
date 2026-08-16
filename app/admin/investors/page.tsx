import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Investors" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  RESTRICTED: "warning",
  CLOSED: "neutral",
};

export default async function AdminInvestorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const investors = await prisma.user.findMany({
    where: {
      role: "INVESTOR",
      ...(q
        ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { kycRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Investors</h1>
        <p className="mt-1 text-sm text-muted">Search and manage investor accounts.</p>
      </div>

      <form method="get" role="search" className="max-w-sm">
        <label htmlFor="q" className="sr-only">Search investors</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </form>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Investor</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">KYC</th>
                <th scope="col" className="px-4 py-3">MFA</th>
                <th scope="col" className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/admin/investors/${inv.id}`} className="font-medium text-brand hover:underline">
                      {inv.name ?? inv.email}
                    </Link>
                    <p className="text-xs text-muted">{inv.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[inv.status] ?? "neutral"}>{inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={inv.kycRecords[0]?.status === "APPROVED" ? "success" : "neutral"}>
                      {inv.kycRecords[0]?.status ?? "NOT_STARTED"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{inv.mfaEnabled ? "Enabled" : "Disabled"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(inv.createdAt)}</td>
                </tr>
              ))}
              {investors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted">No investors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
