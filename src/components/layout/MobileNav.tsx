"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Moon,
  PieChart,
  Plus,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { Avatar } from "@/components/Avatar";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useAuth } from "@/context/AuthContext";
import { useTransactionForm } from "@/components/transactions/TransactionFormProvider";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/statistiques", label: "Stats", icon: PieChart },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { openForm } = useTransactionForm();
  const { user, logout } = useAuth();
  const { resolvedTheme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const TabLink = ({ href, label, icon: Icon }: Tab) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium transition-colors",
          active ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    );
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace("/login");
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-md lg:hidden">
        <TabLink {...TABS[0]} />
        <TabLink {...TABS[1]} />
        <button
          type="button"
          onClick={() => openForm()}
          aria-label="Ajouter une transaction"
          className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7A18] to-[#FF3D2E] text-white shadow-lg transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </button>
        <TabLink {...TABS[2]} />
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 text-[11px] font-medium text-muted-foreground"
        >
          <LayoutGrid className="h-5 w-5" />
          Plus
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto scrollbar-thin rounded-t-2xl border-t border-border bg-card p-4 shadow-xl animate-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar user={user} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user ? fullName(user.firstName, user.lastName) : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs font-medium transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggle}
                className="flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-medium text-expense hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
