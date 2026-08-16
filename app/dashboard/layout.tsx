import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Topbar } from "@/components/dashboard/Topbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ADMIN_ROLES } from "@/lib/auth/guards";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/login?error=AccountNotActive");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <Topbar
        userLabel={session.user.name ?? session.user.email ?? "Investor"}
        isAdmin={ADMIN_ROLES.includes(session.user.role)}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border md:block">
          <Sidebar />
        </aside>
        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
