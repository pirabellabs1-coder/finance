"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { transactions as repo } from "@/lib/repositories";
import type { Transaction, TransactionInput } from "@/lib/types";
import { useAuth } from "./AuthContext";

interface DataContextValue {
  transactions: Transaction[];
  loading: boolean;
  add: (input: TransactionInput) => Promise<void>;
  addMany: (inputs: TransactionInput[]) => Promise<void>;
  edit: (id: string, input: TransactionInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  replaceAll: (txs: Transaction[]) => Promise<void>;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await repo.list(userId);
      setItems(list);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (input: TransactionInput) => {
      if (!userId) return;
      await repo.create(userId, input);
      await reload();
    },
    [userId, reload],
  );

  const addMany = useCallback(
    async (inputs: TransactionInput[]) => {
      if (!userId || inputs.length === 0) return;
      for (const input of inputs) await repo.create(userId, input);
      await reload();
    },
    [userId, reload],
  );

  const edit = useCallback(
    async (id: string, input: TransactionInput) => {
      if (!userId) return;
      await repo.update(userId, id, input);
      await reload();
    },
    [userId, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      await repo.remove(userId, id);
      await reload();
    },
    [userId, reload],
  );

  const replaceAll = useCallback(
    async (txs: Transaction[]) => {
      if (!userId) return;
      await repo.replaceAll(userId, txs);
      await reload();
    },
    [userId, reload],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      transactions: items,
      loading,
      add,
      addMany,
      edit,
      remove,
      replaceAll,
      reload,
    }),
    [items, loading, add, addMany, edit, remove, replaceAll, reload],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData doit être utilisé dans un DataProvider");
  return ctx;
}
