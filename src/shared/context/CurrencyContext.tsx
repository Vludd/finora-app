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
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
  isCurrencyCode,
  type CurrencyCode,
  type CurrencyDefinition,
} from "@/shared/lib/currencies";

const CURRENCY_STORAGE_KEY = "@finora/currency";

type CurrencyContextValue = {
  currency: CurrencyDefinition;
  currencies: typeof CURRENCIES;
  setCurrency: (code: CurrencyCode) => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export async function loadSavedCurrency(): Promise<CurrencyCode> {
  try {
    const savedCode = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(savedCode) ? savedCode : DEFAULT_CURRENCY_CODE;
  } catch {
    return DEFAULT_CURRENCY_CODE;
  }
}

type CurrencyProviderProps = PropsWithChildren<{
  initialCurrencyCode: CurrencyCode;
}>;

export function CurrencyProvider({
  initialCurrencyCode,
  children,
}: CurrencyProviderProps) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(initialCurrencyCode);

  const setCurrency = useCallback(async (code: CurrencyCode) => {
    setCurrencyCode(code);

    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch (error) {
      console.warn("Failed to save the selected currency", error);
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency: getCurrencyByCode(currencyCode),
      currencies: CURRENCIES,
      setCurrency,
    }),
    [currencyCode, setCurrency],
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
