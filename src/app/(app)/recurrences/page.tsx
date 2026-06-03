"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { CategoryGlyph } from "@/components/CategoryIcon";
import { useAuth } from "@/context/AuthContext";
import { usePlanning } from "@/context/PlanningContext";
import {
  categoriesFor,
  getCategory,
  PAYMENT_METHODS,
  RECURRENCE_OPTIONS,
  recurrenceLabel,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { isoFromDate } from "@/lib/stats";
import type {
  PaymentMethod,
  RecurrenceFrequency,
  RecurringRule,
  RecurringRuleInput,
  TransactionType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RecurrencesPage() {
  const { recurring, loading, addRecurring, editRecurring, removeRecurring, toggleRecurring } =
    usePlanning();
  const { user } = useAuth();
  const currency = user?.currency;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringRule | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Loyer, abonnements, salaire… générés automatiquement à chaque échéance.
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouvelle récurrence
        </Button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : recurring.length === 0 ? (
        <EmptyState
          icon={<Repeat className="h-6 w-6" />}
          title="Aucune transaction récurrente"
          description="Automatisez vos dépenses et revenus réguliers (loyer, abonnements, salaire)."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Créer une récurrence
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="space-y-1">
            {recurring.map((rule) => {
              const category = getCategory(rule.categoryId);
              const color = category?.color ?? "#94a3b8";
              const isIncome = rule.type === "income";
              return (
                <div
                  key={rule.id}
                  className="flex items-center gap-3 rounded-xl px-1 py-2.5"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${color}1a`, color }}
                  >
                    <CategoryGlyph icon={category?.icon ?? "package"} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {rule.description}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {recurrenceLabel(rule.frequency)} ·{" "}
                      {rule.active
                        ? `prochaine le ${formatDate(rule.nextDate, "short")}`
                        : "en pause"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      isIncome ? "text-income" : "text-foreground",
                    )}
                  >
                    {isIncome ? "+" : "−"}
                    {formatCurrency(rule.amount, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRecurring(rule.id)}
                    aria-label={rule.active ? "Mettre en pause" : "Activer"}
                    title={rule.active ? "Mettre en pause" : "Activer"}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      rule.active ? "bg-income" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                        rule.active ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(rule);
                        setFormOpen(true);
                      }}
                      aria-label="Modifier"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecurring(rule.id)}
                      aria-label="Supprimer"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-expense"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Modifier la récurrence" : "Nouvelle récurrence"}
      >
        <RecurringForm
          key={editing?.id ?? "new"}
          rule={editing}
          onCancel={() => setFormOpen(false)}
          onSubmit={async (input) => {
            if (editing) await editRecurring(editing.id, input);
            else await addRecurring(input);
            setFormOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}

function RecurringForm({
  rule,
  onSubmit,
  onCancel,
}: {
  rule: RecurringRule | null;
  onSubmit: (input: RecurringRuleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<TransactionType>(rule?.type ?? "expense");
  const [amount, setAmount] = useState(rule ? String(rule.amount) : "");
  const categories = categoriesFor(type);
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? categories[0].id);
  const [description, setDescription] = useState(rule?.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    rule?.paymentMethod ?? "card",
  );
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    rule?.frequency ?? "monthly",
  );
  const [nextDate, setNextDate] = useState(rule?.nextDate ?? isoFromDate(new Date()));
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    const list = categoriesFor(next);
    if (!list.some((c) => c.id === categoryId)) setCategoryId(list[0].id);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const value = parseFloat(amount.replace(",", "."));
    if (!amount || Number.isNaN(value) || value <= 0) next.amount = "Montant invalide.";
    if (!description.trim()) next.description = "La description est requise.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        type,
        amount: value,
        categoryId,
        description: description.trim(),
        paymentMethod,
        frequency,
        nextDate,
        active: rule?.active ?? true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => handleTypeChange("expense")}
          className={cn(
            "h-9 rounded-lg text-sm font-semibold transition-colors",
            type === "expense" ? "bg-card text-expense shadow-sm" : "text-muted-foreground",
          )}
        >
          Dépense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={cn(
            "h-9 rounded-lg text-sm font-semibold transition-colors",
            type === "income" ? "bg-card text-income shadow-sm" : "text-muted-foreground",
          )}
        >
          Revenu
        </button>
      </div>

      <Input
        label="Montant"
        inputMode="decimal"
        placeholder="0,00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={errors.amount}
        autoFocus
      />
      <Select label="Catégorie" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
      <Input
        label="Description"
        placeholder="Ex : Loyer, Netflix…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Fréquence"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
        >
          {RECURRENCE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          label="Prochaine échéance"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
        />
      </div>
      <Select
        label="Moyen de paiement"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
      >
        {PAYMENT_METHODS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </Select>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          {rule ? "Enregistrer" : "Créer"}
        </Button>
      </div>
    </form>
  );
}
