"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  categoriesFor,
  CURRENCIES,
  PAYMENT_METHODS,
  RECURRENCE_OPTIONS,
} from "@/lib/constants";
import { isoFromDate } from "@/lib/stats";
import type {
  PaymentMethod,
  RecurrenceFrequency,
  TransactionInput,
  TransactionType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  initial?: Partial<TransactionInput>;
  isEditing?: boolean;
  onSubmit: (
    input: TransactionInput,
    repeat?: RecurrenceFrequency,
  ) => Promise<void> | void;
  onCancel: () => void;
  onDelete?: () => Promise<void> | void;
}

const today = () => isoFromDate(new Date());

export function TransactionForm({
  initial,
  isEditing,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const { user } = useAuth();
  const symbol =
    CURRENCIES.find((c) => c.code === user?.currency)?.symbol ?? "€";

  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : "",
  );
  const categories = categoriesFor(type);
  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0].id,
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    initial?.paymentMethod ?? "card",
  );
  const [reference, setReference] = useState(initial?.reference ?? "");
  const [repeat, setRepeat] = useState<"none" | RecurrenceFrequency>("none");
  const [errors, setErrors] = useState<{ amount?: string; description?: string; date?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleTypeChange = (next: TransactionType) => {
    setType(next);
    const list = categoriesFor(next);
    if (!list.some((c) => c.id === categoryId)) setCategoryId(list[0].id);
  };

  const parseAmount = () => parseFloat(amount.replace(",", "."));

  const validate = () => {
    const next: typeof errors = {};
    const value = parseAmount();
    if (!amount || Number.isNaN(value) || value <= 0)
      next.amount = "Entrez un montant valide.";
    if (!description.trim()) next.description = "La description est requise.";
    if (!date) next.date = "La date est requise.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(
        {
          type,
          amount: parseAmount(),
          categoryId,
          description: description.trim(),
          date,
          paymentMethod,
          reference: reference.trim() || undefined,
        },
        repeat === "none" ? undefined : repeat,
      );
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
            type === "expense"
              ? "bg-card text-expense shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Dépense
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange("income")}
          className={cn(
            "h-9 rounded-lg text-sm font-semibold transition-colors",
            type === "income"
              ? "bg-card text-income shadow-sm"
              : "text-muted-foreground hover:text-foreground",
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
        rightSlot={
          <span className="px-2.5 text-sm font-medium text-muted-foreground">
            {symbol}
          </span>
        }
      />

      <Select
        label="Catégorie"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>

      <Input
        label="Description"
        placeholder="Ex : Courses, salaire…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={errors.description}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
        />
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
      </div>

      <Input
        label="Référence (optionnel)"
        placeholder="N° de facture, note…"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />

      {!isEditing && (
        <Select
          label="Répéter"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as "none" | RecurrenceFrequency)}
        >
          <option value="none">Ne pas répéter</option>
          {RECURRENCE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      )}

      <div className="flex items-center gap-2 pt-1">
        {onDelete && (
          <Button
            type="button"
            variant={confirmingDelete ? "danger" : "ghost"}
            onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
            className={cn(!confirmingDelete && "text-expense hover:text-expense")}
          >
            <Trash2 className="h-4 w-4" />
            {confirmingDelete ? "Confirmer" : "Supprimer"}
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </div>
    </form>
  );
}
