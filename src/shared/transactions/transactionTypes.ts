export type TransactionType = "expense" | "income" | "transfer";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId: string | null;
  toAccountId: string | null;
  date: string;
  note: string;
};

export type TransactionDraft = Omit<Transaction, "id">;

export function calculateAccountBalance(
  accountId: string,
  transactions: Transaction[],
): number {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === "transfer") {
      if (transaction.accountId === accountId) return balance - transaction.amount;
      if (transaction.toAccountId === accountId) return balance + transaction.amount;
      return balance;
    }

    if (transaction.accountId !== accountId) return balance;
    return balance + (transaction.type === "income" ? transaction.amount : -transaction.amount);
  }, 0);
}
