import type { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { DataProvider } from "@/context/DataContext";
import { PlanningProvider } from "@/context/PlanningContext";
import { TransactionFormProvider } from "@/components/transactions/TransactionFormProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DataProvider>
        <PlanningProvider>
          <TransactionFormProvider>
          <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="lg:pl-64">
              <Header />
              <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 lg:px-8 lg:pb-12">
                {children}
              </main>
            </div>
            <MobileNav />
          </div>
          </TransactionFormProvider>
        </PlanningProvider>
      </DataProvider>
    </AuthGuard>
  );
}
