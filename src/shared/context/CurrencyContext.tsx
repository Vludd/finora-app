import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_CURRENCY_CODE,
  isCurrencyCode,
  type CurrencyCode,
} from "@/shared/lib/currencies";

/**
 * Reads the former app-wide currency only to migrate accounts created before
 * currencies became an account-level property. It is not used as app state.
 */
const LEGACY_CURRENCY_STORAGE_KEY = "@finora/currency";

export async function loadLegacyCurrencyCode(): Promise<CurrencyCode> {
  try {
    const savedCode = await AsyncStorage.getItem(LEGACY_CURRENCY_STORAGE_KEY);
    return isCurrencyCode(savedCode) ? savedCode : DEFAULT_CURRENCY_CODE;
  } catch {
    return DEFAULT_CURRENCY_CODE;
  }
}
