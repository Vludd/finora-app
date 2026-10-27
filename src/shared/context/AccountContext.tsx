import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { DEFAULT_CURRENCY_CODE, isCurrencyCode, type CurrencyCode } from "@/shared/lib/currencies";
import type {
  Account,
  AccountDraft,
  AccountType,
} from "@/shared/accounts/accountTypes";

const ACCOUNT_STORAGE_KEY = "@finora/accounts";

function isAccountType(value: unknown): value is AccountType {
  return value === "card" || value === "cash" || value === "deposit";
}

function isStoredAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<Account>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    isAccountType(item.type) &&
    typeof item.icon === "string" &&
    typeof item.color === "string"
  );
}

export async function loadSavedAccounts(legacyCurrencyCode: CurrencyCode = DEFAULT_CURRENCY_CODE): Promise<Account[]> {
  try {
    const saved = await AsyncStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    const storedAccounts = parsed.filter(isStoredAccount);
    const accounts = storedAccounts.map((account) => ({
      ...account,
      // Keep the former global currency for old accounts so existing amounts
      // retain their original meaning during migration.
      currencyCode: isCurrencyCode((account as Partial<Account>).currencyCode)
        ? (account as Account).currencyCode
        : legacyCurrencyCode,
    }));

    if (storedAccounts.some((account) => !isCurrencyCode((account as Partial<Account>).currencyCode))) {
      try {
        await AsyncStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
      } catch (error) {
        console.warn("Failed to migrate account currencies", error);
      }
    }

    return accounts;
  } catch (error) {
    console.warn("Failed to load accounts", error);
    return [];
  }
}

type AccountContextValue = {
  accounts: Account[];
  addAccount: (draft: AccountDraft) => void;
  updateAccount: (id: string, draft: AccountDraft) => void;
  deleteAccount: (id: string) => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({
  initialAccounts,
  children,
}: PropsWithChildren<{ initialAccounts: Account[] }>) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);

  const commitAccounts = useCallback((nextAccounts: Account[]) => {
    setAccounts(nextAccounts);
    void AsyncStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify(nextAccounts),
    ).catch((error) => console.warn("Failed to save accounts", error));
  }, []);

  const addAccount = useCallback(
    (draft: AccountDraft) => {
      const account: Account = {
        ...draft,
        id: `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      commitAccounts([account, ...accounts]);
    },
    [accounts, commitAccounts],
  );

  const updateAccount = useCallback(
    (id: string, draft: AccountDraft) => {
      commitAccounts(
        accounts.map((account) =>
          account.id === id ? { ...account, ...draft } : account,
        ),
      );
    },
    [accounts, commitAccounts],
  );

  const deleteAccount = useCallback(
    (id: string) => {
      commitAccounts(accounts.filter((account) => account.id !== id));
    },
    [accounts, commitAccounts],
  );

  const value = useMemo(
    () => ({ accounts, addAccount, updateAccount, deleteAccount }),
    [accounts, addAccount, updateAccount, deleteAccount],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccounts(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccounts must be used inside AccountProvider");
  }
  return context;
}
