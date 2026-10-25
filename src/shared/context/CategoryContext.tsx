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
  Category,
  CategoryDraft,
  CategoryType,
} from "@/shared/categories/categoryTypes";

const CATEGORY_STORAGE_KEY = "@finora/categories";

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "expense-food",
    name: "Groceries",
    type: "expense",
    icon: "cart-outline",
    color: "#F59E0B",
  },
  {
    id: "expense-cafe",
    name: "Cafés & restaurants",
    type: "expense",
    icon: "cafe-outline",
    color: "#C08457",
  },
  {
    id: "expense-transport",
    name: "Transport",
    type: "expense",
    icon: "car-outline",
    color: "#6366F1",
  },
  {
    id: "expense-shopping",
    name: "Shopping",
    type: "expense",
    icon: "bag-handle-outline",
    color: "#EC4899",
  },
  {
    id: "expense-housing",
    name: "Housing",
    type: "expense",
    icon: "home-outline",
    color: "#14B8A6",
  },
  {
    id: "expense-health",
    name: "Health",
    type: "expense",
    icon: "medkit-outline",
    color: "#EF4444",
  },
  {
    id: "expense-entertainment",
    name: "Entertainment",
    type: "expense",
    icon: "game-controller-outline",
    color: "#8B5CF6",
  },
  {
    id: "expense-education",
    name: "Education",
    type: "expense",
    icon: "school-outline",
    color: "#0EA5E9",
  },
  {
    id: "expense-bills",
    name: "Utilities",
    type: "expense",
    icon: "flash-outline",
    color: "#F97316",
  },
  {
    id: "expense-travel",
    name: "Travel",
    type: "expense",
    icon: "airplane-outline",
    color: "#06B6D4",
  },
  {
    id: "expense-subscriptions",
    name: "Subscriptions",
    type: "expense",
    icon: "repeat-outline",
    color: "#A855F7",
  },
  {
    id: "expense-other",
    name: "Other",
    type: "expense",
    icon: "ellipsis-horizontal-circle-outline",
    color: "#64748B",
  },
  {
    id: "income-salary",
    name: "Salary",
    type: "income",
    icon: "wallet-outline",
    color: "#10B981",
  },
  {
    id: "income-freelance",
    name: "Freelance",
    type: "income",
    icon: "laptop-outline",
    color: "#6366F1",
  },
  {
    id: "income-investment",
    name: "Investments",
    type: "income",
    icon: "trending-up-outline",
    color: "#14B8A6",
  },
  {
    id: "income-gifts",
    name: "Gifts",
    type: "income",
    icon: "gift-outline",
    color: "#EC4899",
  },
  {
    id: "income-refund",
    name: "Refunds",
    type: "income",
    icon: "return-down-back-outline",
    color: "#F97316",
  },
  {
    id: "income-other",
    name: "Other",
    type: "income",
    icon: "ellipsis-horizontal-circle-outline",
    color: "#64748B",
  },
];

function isCategoryType(value: unknown): value is CategoryType {
  return value === "income" || value === "expense";
}

function isStoredCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<Category>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    isCategoryType(item.type) &&
    typeof item.icon === "string" &&
    typeof item.color === "string"
  );
}

export async function loadSavedCategories(): Promise<Category[]> {
  try {
    const saved = await AsyncStorage.getItem(CATEGORY_STORAGE_KEY);
    if (!saved) return DEFAULT_CATEGORIES.map((category) => ({ ...category }));

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
    }

    return parsed.filter(isStoredCategory);
  } catch (error) {
    console.warn("Failed to load categories", error);
    return DEFAULT_CATEGORIES.map((category) => ({ ...category }));
  }
}

type CategoryContextValue = {
  categories: Category[];
  addCategory: (draft: CategoryDraft) => void;
  updateCategory: (id: string, draft: CategoryDraft) => void;
  deleteCategory: (id: string) => void;
};

const CategoryContext = createContext<CategoryContextValue | null>(null);

export function CategoryProvider({
  initialCategories,
  children,
}: PropsWithChildren<{ initialCategories: Category[] }>) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const commitCategories = useCallback((nextCategories: Category[]) => {
    setCategories(nextCategories);
    void AsyncStorage.setItem(
      CATEGORY_STORAGE_KEY,
      JSON.stringify(nextCategories),
    ).catch((error) => console.warn("Failed to save categories", error));
  }, []);

  const addCategory = useCallback(
    (draft: CategoryDraft) => {
      const category: Category = {
        ...draft,
        id: `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      };
      commitCategories([category, ...categories]);
    },
    [categories, commitCategories],
  );

  const updateCategory = useCallback(
    (id: string, draft: CategoryDraft) => {
      commitCategories(
        categories.map((category) =>
          category.id === id
            ? { ...category, ...draft, nameKey: undefined }
            : category,
        ),
      );
    },
    [categories, commitCategories],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      commitCategories(categories.filter((category) => category.id !== id));
    },
    [categories, commitCategories],
  );

  const value = useMemo(
    () => ({ categories, addCategory, updateCategory, deleteCategory }),
    [categories, addCategory, updateCategory, deleteCategory],
  );

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (!context)
    throw new Error("useCategories must be used inside CategoryProvider");
  return context;
}
