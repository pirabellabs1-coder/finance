"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Printer,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { downloadTransactionsCSV, printTransactions } from "@/lib/export";
import { TransactionList } from "@/components/transactions/TransactionList";
import { useTransactionForm } from "@/components/transactions/TransactionFormProvider";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { computeTotals } from "@/lib/stats";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "income" | "expense";

export default function TransactionsPage() {
  const { transactions, loading } = useData();
  const { user } = useAuth();
  const { openForm } = useTransactionForm();

  const [showFilters, setShowFilters] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [category, setCategory] = useState("all");
  const [payment, setPayment] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const minValue = parseFloat(min.replace(",", "."));
    const maxValue = parseFloat(max.replace(",", "."));
    return transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.categoryId !== category) return false;
      if (payment !== "all" && t.paymentMethod !== payment) return false;
      if (
        needle &&
        !t.description.toLowerCase().includes(needle) &&
        !(t.reference ?? "").toLowerCase().includes(needle)
      )
        return false;
      if (from && t.date < from) return false;
      if (to && t.date > to) return false;
      if (!Number.isNaN(minValue) && t.amount < minValue) return false;
      if (!Number.isNaN(maxValue) && t.amount > maxValue) return false;
      return true;
    });
  }, [transactions, type, category, payment, query, from, to, min, max]);

  const totals = useMemo(() => computeTotals(filtered), [filtered]);

  const activeCount =
    (type !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (payment !== "all" ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (min ? 1 : 0) +
    (max ? 1 : 0);

  const resetFilters = () => {
    setType("all");
    setCategory("all");
    setPayment("all");
    setFrom("");
    setTo("");
    setMin("");
    setMax("");
  };

  return (
    <div className="space-y-5">
      {/* Filtered summary */}
      <div className="grid grid-cols-3 gap-3">
        <Summary label="Revenus" value={formatCurrency(totals.income, user?.currency)} className="text-income" />
        <Summary label="Dépenses" value={formatCurrency(totals.expense, user?.currency)} className="text-expense" />
        <Summary
          label="Solde"
          value={formatCurrency(totals.balance, user?.currency)}
          className={totals.balance >= 0 ? "text-foreground" : "text-expense"}
        />
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Rechercher une transaction…"
            leftIcon={<Search className="h-4 w-4" />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant={showFilters || activeCount > 0 ? "secondary" : "outline"}
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtres</span>
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setExportOpen(true)}
          disabled={filtered.length === 0}
          className="shrink-0"
          title="Exporter"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exporter</span>
        </Button>
      </div>

      {showFilters && (
        <Card className="animate-fade-in">
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select label="Type" value={type} onChange={(e) => setType(e.target.value as TypeFilter)}>
                <option value="all">Tous</option>
                <option value="income">Revenus</option>
                <option value="expense">Dépenses</option>
              </Select>
              <Select label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">Toutes</option>
                <optgroup label="Revenus">
                  {INCOME_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Dépenses">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              </Select>
              <Select label="Moyen de paiement" value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option value="all">Tous</option>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
              <Input type="date" label="Du" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" label="Au" value={to} onChange={(e) => setTo(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input inputMode="decimal" label="Montant min" placeholder="0" value={min} onChange={(e) => setMin(e.target.value)} />
                <Input inputMode="decimal" label="Montant max" placeholder="∞" value={max} onChange={(e) => setMax(e.target.value)} />
              </div>
            </div>
            {activeCount > 0 && (
              <div className="flex justify-end">
                <Button type="button" variant="ghost" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title={
            transactions.length === 0
              ? "Aucune transaction"
              : "Aucun résultat"
          }
          description={
            transactions.length === 0
              ? "Ajoutez votre première transaction pour commencer."
              : "Essayez d’ajuster votre recherche ou vos filtres."
          }
          action={
            transactions.length === 0 ? (
              <Button onClick={() => openForm()}>Ajouter une transaction</Button>
            ) : activeCount > 0 ? (
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div>
          <p className="mb-2 px-1 text-xs text-muted-foreground">
            {filtered.length} transaction{filtered.length > 1 ? "s" : ""}
          </p>
          <TransactionList transactions={filtered} />
        </div>
      )}

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exporter"
        description={`${filtered.length} transaction(s) selon les filtres actuels.`}
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              downloadTransactionsCSV(filtered, user?.currency);
              setExportOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-income/10 text-income">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">CSV / Excel</p>
              <p className="text-xs text-muted-foreground">
                Fichier .csv compatible Excel et Google Sheets.
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              printTransactions(filtered, user?.currency);
              setExportOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Printer className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Imprimer / PDF</p>
              <p className="text-xs text-muted-foreground">
                Ouvre une vue imprimable — choisissez « Enregistrer en PDF ».
              </p>
            </div>
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Summary({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("mt-1 truncate text-lg font-bold tabular-nums", className)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
