"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  CheckSquare,
  Settings,
  LogOut,
  FileText,
  FolderOpen,
  Scale,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface RegulationLink {
  id: string;
  name: string;
  slug: string;
  score: number;
}

const mainNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Regelgeving",
    href: "/dashboard/regulations",
    icon: Scale,
  },
  {
    label: "Data & Rapportage",
    href: "/dashboard/data",
    icon: BarChart3,
  },
  {
    label: "Actieplan",
    href: "/dashboard/actions",
    icon: CheckSquare,
  },
  {
    label: "Documenten",
    href: "/dashboard/documents",
    icon: FolderOpen,
  },
  {
    label: "Instellingen",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [regulations, setRegulations] = useState<RegulationLink[]>([]);
  const [regsOpen, setRegsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadRegulations() {
      try {
        const res = await fetch("/api/dashboard/regulations");
        if (res.ok) {
          const data = await res.json();
          setRegulations(data);
        }
      } catch (err) {
        console.error("Failed to load regulations:", err);
      }
    }
    if (status === "authenticated") {
      loadRegulations();
    }
  }, [status]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="animate-pulse text-[#64748B]">Laden...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const orgName = session?.user?.organizationName || "Organisatie";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Org header */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F4E79] text-white text-sm font-bold">
            {orgName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#334155]">
              {orgName}
            </p>
            <p className="text-xs text-[#64748B]">RevAct Comply</p>
          </div>
        </div>
      </div>

      <Separator className="mx-4" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#1F4E79]/10 text-[#1F4E79]"
                  : "text-[#64748B] hover:bg-gray-100 hover:text-[#334155]"
              }`}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Regulation links section */}
        {regulations.length > 0 && (
          <>
            <Separator className="my-3" />
            <button
              onClick={() => setRegsOpen(!regsOpen)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#64748B] hover:text-[#334155]"
            >
              {regsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Regelgeving
            </button>
            {regsOpen &&
              regulations.map((reg) => {
                const regHref = `/dashboard/regulations/${reg.slug}`;
                const active = pathname === regHref;
                return (
                  <Link
                    key={reg.id}
                    href={regHref}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-[#1F4E79]/10 text-[#1F4E79] font-medium"
                        : "text-[#64748B] hover:bg-gray-100 hover:text-[#334155]"
                    }`}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{reg.name}</span>
                  </Link>
                );
              })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 px-3 py-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sm text-[#64748B] hover:text-[#DC2626] hover:bg-red-50"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4.5 w-4.5" />
          Uitloggen
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 bg-[#F1F5F9]">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#F1F5F9] shadow-xl">
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-4 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-[#334155]">
            {orgName}
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
