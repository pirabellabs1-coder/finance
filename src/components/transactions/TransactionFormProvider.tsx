"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm } from "./TransactionForm";
import { useData } from "@/context/DataContext";
import { usePlanning } from "@/context/PlanningContext";
import { nextOccurrence } from "@/lib/stats";
import type {
  RecurrenceFrequency,
  Transaction,
  TransactionInput,
  TransactionType,
} from "@/lib/types";

interface OpenOptions {
  type?: TransactionType;
  transaction?: Transaction;
}

interface TransactionFormContextValue {
  openForm: (options?: OpenOptions) => void;
}

const TransactionFormContext = createContext<
  TransactionFormContextValue | undefined
>(undefined);

export function TransactionFormProvider({ children }: { children: ReactNode }) {
  const { add, edit, remove } = useData();
  const { addRecurring } = usePlanning();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [defaultType, setDefaultType] = useState<TransactionType>("expense");
  const [formKey, setFormKey] = useState(0);

  const openForm = useCallback((options?: OpenOptions) => {
    setEditing(options?.transaction ?? null);
    setDefaultType(options?.transaction?.type ?? options?.type ?? "expense");
    setFormKey((k) => k + 1);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const handleSubmit = useCallback(
    async (input: TransactionInput, repeat?: RecurrenceFrequency) => {
      if (editing) {
        await edit(editing.id, input);
      } else {
        await add(input);
        if (repeat) {
          await addRecurring({
            type: input.type,
            amount: input.amount,
            categoryId: input.categoryId,
            description: input.description,
            paymentMethod: input.paymentMethod,
            frequency: repeat,
            nextDate: nextOccurrence(input.date, repeat),
            active: true,
          });
        }
      }
      setOpen(false);
    },
    [editing, add, edit, addRecurring],
  );

  const handleDelete = useCallback(async () => {
    if (!editing) return;
    await remove(editing.id);
    setOpen(false);
  }, [editing, remove]);

  const value = useMemo(() => ({ openForm }), [openForm]);

  return (
    <TransactionFormContext.Provider value={value}>
      {children}
      <Modal
        open={open}
        onClose={close}
        title={editing ? "Modifier la transaction" : "Nouvelle transaction"}
      >
        <TransactionForm
          key={formKey}
          initial={editing ?? { type: defaultType }}
          isEditing={Boolean(editing)}
          onSubmit={handleSubmit}
          onCancel={close}
          onDelete={editing ? handleDelete : undefined}
        />
      </Modal>
    </TransactionFormContext.Provider>
  );
}

export function useTransactionForm() {
  const ctx = useContext(TransactionFormContext);
  if (!ctx)
    throw new Error(
      "useTransactionForm doit être utilisé dans un TransactionFormProvider",
    );
  return ctx;
}
