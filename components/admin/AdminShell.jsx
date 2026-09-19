"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgePercent,
  ClipboardList,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Users,
  UserRound,
  Warehouse,
  X,
} from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/coupons", label: "Coupons", icon: BadgePercent },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, isReady, isAuthenticated, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!isReady || isLogin) return;
    if (!isAuthenticated) {
      router.replace("/admin/login");
    }
  }, [isReady, isAuthenticated, isLogin, router]);

  if (isLogin) {
    return children;
  }

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream text-sm text-neutral-500">
        Checking admin session...
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-primary-dark text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <BrandLogo size={48} showWordmark variant="light" />
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-brand-accent">
          Admin Console
        </p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-accent text-brand-primary-dark"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold">{admin.name}</p>
        <p className="truncate text-xs text-white/60">{admin.phone}</p>
        <p className="truncate text-xs text-white/60">{admin.email}</p>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/admin/login");
          }}
          className="mt-3 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-dvh overflow-hidden bg-brand-cream lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden h-full lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      )}

      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-3 lg:px-8">
          <button
            type="button"
            className="rounded-full p-2 text-brand-primary hover:bg-brand-cream lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open admin menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
              Budy Bear
            </p>
            <h1 className="text-lg font-black text-brand-primary">Store management</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-xs font-semibold text-brand-primary hover:bg-brand-primary hover:text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            View store
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
