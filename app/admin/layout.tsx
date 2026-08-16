import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/auth/guards";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!ADMIN_ROLES.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <AdminTopbar userLabel={session.user.name ?? session.user.email ?? "Admin"} role={session.user.role} />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <AdminSidebar />
        </aside>
        <main id="main-content" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
