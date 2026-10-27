import { Ionicons } from "@expo/vector-icons";
import type { CurrencyCode } from "@/shared/lib/currencies";

export type AccountType = "card" | "cash" | "deposit";
export type AccountIcon = keyof typeof Ionicons.glyphMap;

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  icon: AccountIcon;
  color: string;
  currencyCode: CurrencyCode;
};

export type AccountDraft = Pick<Account, "name" | "type" | "icon" | "color" | "currencyCode">;
