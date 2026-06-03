"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PieChart,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { useTransactionForm } from "@/components/transactions/TransactionFormProvider";
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
  { href: "/profil", label: "Profil", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const { openForm } = useTransactionForm();

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

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 px-2 backdrop-blur-md lg:hidden">
      <TabLink {...TABS[0]} />
      <TabLink {...TABS[1]} />
      <button
        type="button"
        onClick={() => openForm()}
        aria-label="Ajouter une transaction"
        className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>
      <TabLink {...TABS[2]} />
      <TabLink {...TABS[3]} />
    </nav>
  );
}
