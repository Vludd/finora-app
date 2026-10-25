import { Ionicons } from "@expo/vector-icons";

export type AccountType = "card" | "cash" | "deposit";
export type AccountIcon = keyof typeof Ionicons.glyphMap;

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  icon: AccountIcon;
  color: string;
};

export type AccountDraft = Pick<Account, "name" | "type" | "icon" | "color">;
