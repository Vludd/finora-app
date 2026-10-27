import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useCategories } from "@/shared/context/CategoryContext";
import { useTheme } from "@/shared/theme/ThemeContext";

export default function BudgetsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { categories } = useCategories();

  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );

  const openCategorySettings = () => {
    router.push("/categories");
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm leading-5 text-muted">
          {t("budgets.description")}
        </Text>

        <View className="gap-4 rounded-[22px] border border-border bg-surface p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-accent-dark">
              <Ionicons
                name="pricetags-outline"
                size={23}
                color={colors.accent}
              />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-base font-bold text-foreground">
                {t("budgets.categorySettingsTitle")}
              </Text>
              <Text className="text-sm leading-5 text-muted">
                {t("budgets.categorySettingsDescription")}
              </Text>
            </View>
            <View className="rounded-full bg-background px-2.5 py-1">
              <Text className="text-xs font-bold text-muted">
                {expenseCategories.length}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={openCategorySettings}
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-[15px] bg-accent px-4 py-3"
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={colors.accentContrastText}
            />
            <Text
              className="text-sm font-bold"
              style={{ color: colors.accentContrastText }}
            >
              {t("budgets.manageCategories")}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={17}
              color={colors.accentContrastText}
            />
          </Pressable>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-lg font-extrabold text-foreground">
              {t("budgets.expenseCategories")}
            </Text>
            <Text className="text-xs font-semibold text-muted">
              {t("budgets.categoryCount", { count: expenseCategories.length })}
            </Text>
          </View>

          {expenseCategories.length > 0 ? (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {expenseCategories.map((category) => (
                <View
                  key={category.id}
                  className="w-[48.5%] flex-row items-center gap-3 rounded-[18px] border border-border bg-surface p-3"
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-[13px]"
                    style={{
                      backgroundColor: `${category.color}20`,
                    }}
                  >
                    <Ionicons
                      name={category.icon}
                      size={20}
                      color={category.color}
                    />
                  </View>
                  <Text
                    numberOfLines={2}
                    className="min-w-0 flex-1 text-sm font-semibold text-foreground"
                  >
                    {category.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center rounded-[20px] border border-dashed border-border bg-surface px-5 py-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-accent-dark">
                <Ionicons
                  name="pricetags-outline"
                  size={22}
                  color={colors.accent}
                />
              </View>
              <Text className="mt-3 text-center text-base font-bold text-foreground">
                {t("budgets.noExpenseCategories")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={openCategorySettings}
                className="mt-3 rounded-[13px] bg-accent-dark px-4 py-2.5"
              >
                <Text className="text-sm font-bold text-accent">
                  {t("budgets.manageCategories")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
