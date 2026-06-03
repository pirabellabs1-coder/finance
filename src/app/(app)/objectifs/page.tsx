"use client";

import { useState, type FormEvent } from "react";
import { Minus, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthContext";
import { usePlanning } from "@/context/PlanningContext";
import { GOAL_COLORS } from "@/lib/constants";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import type { SavingsGoal } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ObjectifsPage() {
  const { goals, loading, addGoal, editGoal, removeGoal, contributeGoal } =
    usePlanning();
  const { user } = useAuth();
  const currency = user?.currency;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (goal: SavingsGoal) => {
    setEditing(goal);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mettez de l’argent de côté pour vos projets.
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nouvel objectif
        </Button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="Aucun objectif d’épargne"
          description="Créez un objectif (ex : « Vacances 1 500 € ») et suivez votre progression."
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Créer un objectif
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const ratio = goal.target > 0 ? goal.saved / goal.target : 0;
            const done = goal.saved >= goal.target && goal.target > 0;
            return (
              <Card key={goal.id} className="overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: goal.color }} />
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {goal.name}
                      </p>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground">
                          Échéance : {formatDate(goal.deadline, "medium")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(goal)}
                        aria-label="Modifier"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeGoal(goal.id)}
                        aria-label="Supprimer"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-end justify-between">
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {formatCurrency(goal.saved, currency)}
                        <span className="text-sm font-normal text-muted-foreground">
                          {" "}
                          / {formatCurrency(goal.target, currency)}
                        </span>
                      </p>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          done ? "text-income" : "text-muted-foreground",
                        )}
                      >
                        {done ? "Atteint 🎉" : formatPercent(ratio, 0)}
                      </span>
                    </div>
                    <ProgressBar
                      value={goal.saved}
                      max={goal.target}
                      colorClassName={done ? "bg-income" : undefined}
                      className={done ? undefined : ""}
                    />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setContributing(goal)}
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter au pot
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <GoalFormModal
        open={formOpen}
        goal={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          if (editing) await editGoal(editing.id, input);
          else await addGoal(input);
          setFormOpen(false);
        }}
      />

      <ContributeModal
        goal={contributing}
        onClose={() => setContributing(null)}
        onContribute={async (amount) => {
          if (contributing) await contributeGoal(contributing.id, amount);
          setContributing(null);
        }}
      />
    </div>
  );
}

function GoalFormModal({
  open,
  goal,
  onClose,
  onSubmit,
}: {
  open: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    target: number;
    saved: number;
    deadline?: string;
    color: string;
  }) => Promise<void>;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={goal ? "Modifier l’objectif" : "Nouvel objectif"}
    >
      <GoalForm key={goal?.id ?? "new"} goal={goal} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
}

function GoalForm({
  goal,
  onSubmit,
  onCancel,
}: {
  goal: SavingsGoal | null;
  onSubmit: (input: {
    name: string;
    target: number;
    saved: number;
    deadline?: string;
    color: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal ? String(goal.target) : "");
  const [saved, setSaved] = useState(goal ? String(goal.saved) : "0");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    const targetValue = parseFloat(target.replace(",", "."));
    if (!name.trim()) next.name = "Le nom est requis.";
    if (!target || Number.isNaN(targetValue) || targetValue <= 0)
      next.target = "Montant cible invalide.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const savedValue = parseFloat(saved.replace(",", "."));
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        target: targetValue,
        saved: Number.isNaN(savedValue) || savedValue < 0 ? 0 : savedValue,
        deadline: deadline || undefined,
        color,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nom de l’objectif"
        placeholder="Ex : Vacances, Fonds d’urgence…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Montant cible"
          inputMode="decimal"
          placeholder="1500"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          error={errors.target}
        />
        <Input
          label="Déjà épargné"
          inputMode="decimal"
          placeholder="0"
          value={saved}
          onChange={(e) => setSaved(e.target.value)}
        />
      </div>
      <Input
        type="date"
        label="Échéance (optionnel)"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
      />
      <div>
        <p className="mb-1.5 block text-sm font-medium text-foreground">Couleur</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Couleur ${c}`}
              className={cn(
                "h-8 w-8 rounded-full transition-transform",
                color === c && "ring-2 ring-ring ring-offset-2 ring-offset-card",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={submitting}>
          {goal ? "Enregistrer" : "Créer"}
        </Button>
      </div>
    </form>
  );
}

function ContributeModal({
  goal,
  onClose,
  onContribute,
}: {
  goal: SavingsGoal | null;
  onClose: () => void;
  onContribute: (amount: number) => Promise<void>;
}) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");

  const submit = async (sign: 1 | -1) => {
    const value = parseFloat(amount.replace(",", "."));
    if (Number.isNaN(value) || value <= 0) return;
    await onContribute(sign * value);
    setAmount("");
  };

  return (
    <Modal
      open={Boolean(goal)}
      onClose={onClose}
      title="Ajouter au pot"
      description={goal?.name}
    >
      {goal && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Actuellement épargné : {formatCurrency(goal.saved, user?.currency)} /{" "}
            {formatCurrency(goal.target, user?.currency)}
          </p>
          <Input
            inputMode="decimal"
            placeholder="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => submit(-1)}
            >
              <Minus className="h-4 w-4" />
              Retirer
            </Button>
            <Button type="button" className="flex-1" onClick={() => submit(1)}>
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
