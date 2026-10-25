import { Ionicons } from "@expo/vector-icons";

export type CategoryType = "expense" | "income";
export type CategoryIcon = keyof typeof Ionicons.glyphMap;

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  icon: CategoryIcon;
  color: string;
};

export type CategoryDraft = Pick<Category, "name" | "type" | "icon" | "color">;
