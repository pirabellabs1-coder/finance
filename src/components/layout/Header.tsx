"use client";

import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { Logo } from "./Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { NotificationBell } from "./NotificationBell";
import { useTransactionForm } from "@/components/transactions/TransactionFormProvider";

export function Header() {
  const pathname = usePathname();
  const { openForm } = useTransactionForm();
  const current = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
      <div className="lg:hidden">
        <Logo />
      </div>
      <h1 className="hidden text-lg font-semibold text-foreground lg:block">
        {current?.label ?? "Tableau de bord"}
      </h1>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <ThemeToggle />
        <Button onClick={() => openForm()} className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>
    </header>
  );
}
