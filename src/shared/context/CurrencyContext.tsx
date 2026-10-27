import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  DEFAULT_CURRENCY_CODE,
  isCurrencyCode,
  type CurrencyCode,
} from "@/shared/lib/currencies";

/**
 * Reads the former app-wide currency to migrate accounts created before
 * currencies became an account-level property.
 */
const LEGACY_CURRENCY_STORAGE_KEY = "@finora/currency";
const PREFERRED_CURRENCY_STORAGE_KEY = "@finora/preferredCurrency";

export async function loadLegacyCurrencyCode(): Promise<CurrencyCode> {
  try {
    const savedCode = await AsyncStorage.getItem(LEGACY_CURRENCY_STORAGE_KEY);
    return isCurrencyCode(savedCode) ? savedCode : DEFAULT_CURRENCY_CODE;
  } catch {
    return DEFAULT_CURRENCY_CODE;
  }
}

export async function loadSavedPreferredCurrencyCode(
  fallbackCode: CurrencyCode = DEFAULT_CURRENCY_CODE,
): Promise<CurrencyCode> {
  try {
    const savedCode = await AsyncStorage.getItem(PREFERRED_CURRENCY_STORAGE_KEY);
    return isCurrencyCode(savedCode) ? savedCode : fallbackCode;
  } catch {
    return fallbackCode;
  }
}

type CurrencyContextValue = {
  currencyCode: CurrencyCode;
  setCurrencyCode: (code: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  initialCurrencyCode,
  children,
}: PropsWithChildren<{ initialCurrencyCode: CurrencyCode }>) {
  const [currencyCode, setCurrencyCodeState] =
    useState<CurrencyCode>(initialCurrencyCode);

  const setCurrencyCode = useCallback((code: CurrencyCode) => {
    setCurrencyCodeState(code);
    void AsyncStorage.setItem(PREFERRED_CURRENCY_STORAGE_KEY, code).catch(
      (error) => console.warn("Failed to save preferred currency", error),
    );
  }, []);

  const value = useMemo(
    () => ({ currencyCode, setCurrencyCode }),
    [currencyCode, setCurrencyCode],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return context;
}
