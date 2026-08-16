"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { AdminSidebar } from "./AdminSidebar";

export function AdminTopbar({ userLabel, role }: { userLabel: string; role: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md p-2 hover:bg-surface lg:hidden"
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-sm font-bold text-white"
            >
              S
            </span>
            SynxHub Admin
          </Link>
          <Badge tone="brand">{role}</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden text-sm font-medium text-brand hover:underline sm:inline">
            Investor dashboard
          </Link>
          <span className="hidden text-sm text-muted sm:inline">{userLabel}</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>

      {open && (
        <div id="admin-mobile-nav" className="border-t border-border lg:hidden">
          <AdminSidebar />
        </div>
      )}
    </header>
  );
}
