import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type {
  Transaction,
  TransactionDraft,
  TransactionType,
} from "@/shared/transactions/transactionTypes";

const TRANSACTION_STORAGE_KEY = "@finora/transactions";

function isTransactionType(value: unknown): value is TransactionType {
  return value === "expense" || value === "income" || value === "transfer";
}

function isStoredTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Transaction>;
  return (
    typeof item.id === "string" &&
    isTransactionType(item.type) &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    (item.toAmount === null || item.toAmount === undefined || (typeof item.toAmount === "number" && Number.isFinite(item.toAmount) && item.toAmount > 0)) &&
    item.amount > 0 &&
    typeof item.accountId === "string" &&
    typeof item.date === "string" &&
    (typeof item.note === "string" || item.note === undefined) &&
    (item.categoryId === null ||
      item.categoryId === undefined ||
      typeof item.categoryId === "string") &&
    (item.toAccountId === null ||
      item.toAccountId === undefined ||
      typeof item.toAccountId === "string")
  );
}

export async function loadSavedTransactions(): Promise<Transaction[]> {
  try {
    const saved = await AsyncStorage.getItem(TRANSACTION_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredTransaction).map((transaction) => ({
      ...transaction,
      // Older transfers had one amount; retain that value for the destination.
      toAmount: transaction.type === "transfer"
        ? (transaction.toAmount ?? transaction.amount)
        : null,
    }));
  } catch (error) {
    console.warn("Failed to load transactions", error);
    return [];
  }
}

type TransactionContextValue = {
  transactions: Transaction[];
  addTransaction: (draft: TransactionDraft) => void;
  updateTransaction: (id: string, draft: TransactionDraft) => void;
  deleteTransaction: (id: string) => void;
};

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({
  initialTransactions,
  children,
}: PropsWithChildren<{ initialTransactions: Transaction[] }>) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);

  const commitTransactions = useCallback((nextTransactions: Transaction[]) => {
    setTransactions(nextTransactions);
    void AsyncStorage.setItem(
      TRANSACTION_STORAGE_KEY,
      JSON.stringify(nextTransactions),
    ).catch((error) => console.warn("Failed to save transactions", error));
  }, []);

  const addTransaction = useCallback(
    (draft: TransactionDraft) => {
      const transaction: Transaction = {
        ...draft,
        id: `transaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      commitTransactions([transaction, ...transactions]);
    },
    [transactions, commitTransactions],
  );

  const updateTransaction = useCallback(
    (id: string, draft: TransactionDraft) => {
      commitTransactions(
        transactions.map((transaction) =>
          transaction.id === id ? { ...draft, id } : transaction,
        ),
      );
    },
    [transactions, commitTransactions],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      commitTransactions(
        transactions.filter((transaction) => transaction.id !== id),
      );
    },
    [transactions, commitTransactions],
  );

  const value = useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [transactions, addTransaction, updateTransaction, deleteTransaction],
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextValue {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used inside TransactionProvider");
  }
  return context;
}
