import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  Category,
  CategoryDraft,
  CategoryIcon,
  CategoryType,
} from "@/shared/categories/categoryTypes";
import { useCategories } from "@/shared/context/CategoryContext";
import { useTheme } from "@/shared/theme/ThemeContext";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";

const categoryIcons: CategoryIcon[] = [
  "pricetag-outline",
  "cart-outline",
  "basket-outline",
  "bag-handle-outline",
  "fast-food-outline",
  "restaurant-outline",
  "cafe-outline",
  "car-outline",
  "bus-outline",
  "train-outline",
  "airplane-outline",
  "bicycle-outline",
  "home-outline",
  "key-outline",
  "bed-outline",
  "flash-outline",
  "water-outline",
  "wifi-outline",
  "phone-portrait-outline",
  "laptop-outline",
  "headset-outline",
  "camera-outline",
  "film-outline",
  "musical-notes-outline",
  "game-controller-outline",
  "ticket-outline",
  "book-outline",
  "school-outline",
  "briefcase-outline",
  "wallet-outline",
  "cash-outline",
  "card-outline",
  "trending-up-outline",
  "bar-chart-outline",
  "gift-outline",
  "heart-outline",
  "medkit-outline",
  "fitness-outline",
  "paw-outline",
  "shirt-outline",
  "leaf-outline",
  "flower-outline",
  "hammer-outline",
  "construct-outline",
  "business-outline",
  "people-outline",
  "person-outline",
  "calendar-outline",
  "time-outline",
  "globe-outline",
  "rocket-outline",
  "star-outline",
  "sunny-outline",
  "moon-outline",
  "document-text-outline",
  "receipt-outline",
  "repeat-outline",
  "return-down-back-outline",
  "ellipsis-horizontal-circle-outline",
  "grid-outline",
];

const categoryColors = [
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#EF4444",
  "#78716C",
];

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { categories, addCategory, updateCategory, deleteCategory } =
    useCategories();

  const [activeType, setActiveType] = useState<CategoryType>("expense");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<CategoryType>("expense");
  const [draftIcon, setDraftIcon] = useState<CategoryIcon>("pricetag-outline");
  const [draftColor, setDraftColor] = useState(categoryColors[4]);
  const [nameError, setNameError] = useState(false);

  const visibleCategories = categories.filter(
    (category) => category.type === activeType,
  );
  const expenseCount = categories.filter(
    (category) => category.type === "expense",
  ).length;
  const incomeCount = categories.filter(
    (category) => category.type === "income",
  ).length;

  function openCreateEditor() {
    setEditingId(null);
    setDraftName("");
    setDraftType(activeType);
    setDraftIcon("pricetag-outline");
    setDraftColor(categoryColors[4]);
    setNameError(false);
    setEditorVisible(true);
  }

  function openEditEditor(category: Category) {
    setEditingId(category.id);
    setDraftName(category.name);
    setDraftType(category.type);
    setDraftIcon(category.icon);
    setDraftColor(category.color);
    setNameError(false);
    setEditorVisible(true);
  }

  function saveCategory() {
    const name = draftName.trim();
    if (!name) {
      setNameError(true);
      return;
    }

    const draft: CategoryDraft = {
      name,
      type: draftType,
      icon: draftIcon,
      color: draftColor,
    };

    if (editingId) {
      updateCategory(editingId, draft);
    } else {
      addCategory(draft);
    }

    setActiveType(draftType);
    setEditorVisible(false);
  }

  function confirmDelete(category: Category) {
    Alert.alert(
      t("categories.manage.deleteTitle"),
      t("categories.manage.deleteMessage", {
        name: category.name,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteCategory(category.id),
        },
      ],
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-background pt-3"
      edges={["top", "bottom"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-10 pt-3"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-[15px] border border-border bg-surface"
          >
            <Ionicons name="arrow-back" size={21} color={colors.foreground} />
          </Pressable>

          <View className="min-w-0 flex-1">
            <Text className="text-[25px] font-extrabold tracking-[-0.6px] text-foreground">
              {t("categories.manage.title")}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              {t("categories.manage.description")}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TypeTab
            label={t("categories.manage.expense")}
            count={expenseCount}
            icon="arrow-up-outline"
            selected={activeType === "expense"}
            color={colors.expense}
            onPress={() => setActiveType("expense")}
          />
          <TypeTab
            label={t("categories.manage.income")}
            count={incomeCount}
            icon="arrow-down-outline"
            selected={activeType === "income"}
            color={colors.income}
            onPress={() => setActiveType("income")}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={openCreateEditor}
          className="min-h-[58px] flex-row items-center justify-center gap-2 rounded-[17px] bg-accent px-4"
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={colors.accentContrastText}
          />
          <Text
            className="text-[15px] font-bold"
            style={{ color: colors.accentContrastText }}
          >
            {t("categories.manage.addCategory")}
          </Text>
        </Pressable>

        {visibleCategories.length > 0 ? (
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {visibleCategories.map((category) => (
              <View
                key={category.id}
                className="w-[48.5%] rounded-[19px] border border-border bg-surface p-3"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t("common.edit")}: ${category.name}`}
                    onPress={() => openEditEditor(category)}
                    className="h-12 w-12 items-center justify-center rounded-[16px]"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Ionicons
                      name={category.icon}
                      size={24}
                      color={category.color}
                    />
                  </Pressable>

                  <View className="flex-row gap-1">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t("common.edit")}: ${category.name}`}
                      hitSlop={5}
                      onPress={() => openEditEditor(category)}
                      className="h-8 w-8 items-center justify-center rounded-[10px]"
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.muted}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t("common.delete")}: ${category.name}`}
                      hitSlop={5}
                      onPress={() => confirmDelete(category)}
                      className="h-8 w-8 items-center justify-center rounded-[10px]"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color={colors.subtle}
                      />
                    </Pressable>
                  </View>
                </View>

                <Text
                  className="mt-3 min-h-[40px] text-[14px] font-bold leading-5 text-foreground"
                  numberOfLines={2}
                >
                  {category.name}
                </Text>
                <View
                  className="mt-2 h-[3px] w-10 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center rounded-[20px] border border-border bg-surface px-6 py-8">
            <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-accent-dark">
              <Ionicons
                name="pricetags-outline"
                size={26}
                color={colors.accent}
              />
            </View>
            <Text className="mt-4 text-center text-base font-bold text-foreground">
              {t("categories.manage.emptyTitle")}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              {t("categories.manage.emptyDescription")}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editorVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setEditorVisible(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black/50"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            className="rounded-t-[28px] bg-background px-4 pt-4"
            style={{
              maxHeight: "92%",
              paddingBottom: Math.max(insets.bottom + 8, 20),
            }}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-[21px] font-extrabold text-foreground">
                  {editingId
                    ? t("categories.manage.editCategory")
                    : t("categories.manage.newCategory")}
                </Text>
                <Text className="mt-1 text-xs text-muted">
                  {t("categories.manage.editorDescription")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
                onPress={() => setEditorVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-[13px] border border-border bg-surface"
              >
                <Ionicons name="close" size={21} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="gap-5 pb-3"
            >
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("categories.manage.categoryType")}
                </Text>
                <View className="flex-row gap-2">
                  <DraftTypeButton
                    label={t("categories.manage.expense")}
                    icon="arrow-up-outline"
                    selected={draftType === "expense"}
                    color={colors.expense}
                    onPress={() => setDraftType("expense")}
                  />
                  <DraftTypeButton
                    label={t("categories.manage.income")}
                    icon="arrow-down-outline"
                    selected={draftType === "income"}
                    color={colors.income}
                    onPress={() => setDraftType("income")}
                  />
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("categories.manage.categoryName")}
                </Text>
                <TextInput
                  value={draftName}
                  onChangeText={(value) => {
                    setDraftName(value);
                    if (value.trim()) setNameError(false);
                  }}
                  placeholder={t("categories.manage.namePlaceholder")}
                  placeholderTextColor={colors.subtle}
                  maxLength={40}
                  returnKeyType="done"
                  className={`min-h-[50px] rounded-[14px] border bg-surface px-3 text-[15px] text-foreground ${nameError ? "border-expense" : "border-border"}`}
                  accessibilityLabel={t("categories.manage.categoryName")}
                />
                {nameError && (
                  <Text className="text-xs text-expense">
                    {t("categories.manage.nameRequired")}
                  </Text>
                )}
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("categories.manage.chooseIcon")}
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-2">
                  {categoryIcons.map((iconName) => {
                    const selected = draftIcon === iconName;
                    return (
                      <Pressable
                        key={iconName}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={iconName
                          .replace(/-outline$/, "")
                          .replace(/-/g, " ")}
                        onPress={() => setDraftIcon(iconName)}
                        className="aspect-square w-[15.5%] items-center justify-center rounded-[12px] border"
                        style={{
                          backgroundColor: selected
                            ? `${draftColor}20`
                            : colors.surface,
                          borderColor: selected ? draftColor : colors.border,
                        }}
                      >
                        <Ionicons
                          name={iconName}
                          size={22}
                          color={selected ? draftColor : colors.muted}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("categories.manage.accentColor")}
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {categoryColors.map((color) => {
                    const selected = draftColor === color;
                    return (
                      <Pressable
                        key={color}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${t("categories.manage.colorOption")} ${color}`}
                        onPress={() => setDraftColor(color)}
                        className="h-9 w-[9.5%] items-center justify-center rounded-full border-2"
                        style={{
                          backgroundColor: color,
                          borderColor: selected
                            ? colors.foreground
                            : "transparent",
                        }}
                      >
                        {selected && (
                          <Ionicons
                            name="checkmark"
                            size={17}
                            color="#FFFFFF"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="flex-row items-center gap-3 rounded-[16px] border border-border bg-surface p-3">
                <View
                  className="h-12 w-12 items-center justify-center rounded-[16px]"
                  style={{ backgroundColor: `${draftColor}20` }}
                >
                  <Ionicons name={draftIcon} size={25} color={draftColor} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[1px] text-subtle">
                    {t("categories.manage.preview")}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-1 text-[15px] font-bold text-foreground"
                  >
                    {draftName.trim() || t("categories.manage.namePlaceholder")}
                  </Text>
                </View>
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor: `${draftType === "income" ? colors.income : colors.expense}20`,
                  }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      color:
                        draftType === "income" ? colors.income : colors.expense,
                    }}
                  >
                    {draftType === "income"
                      ? t("categories.manage.income")
                      : t("categories.manage.expense")}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-3 border-t border-border pt-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditorVisible(false)}
                className="min-h-[50px] flex-1 items-center justify-center rounded-[14px] border border-border bg-surface"
              >
                <Text className="text-sm font-bold text-foreground">
                  {t("common.cancel")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={saveCategory}
                className="min-h-[50px] flex-1 flex-row items-center justify-center gap-2 rounded-[14px] bg-accent"
              >
                <Ionicons
                  name="checkmark"
                  size={19}
                  color={colors.accentContrastText}
                />
                <Text
                  className="text-sm font-bold"
                  style={{ color: colors.accentContrastText }}
                >
                  {t("common.save")}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

type TypeTabProps = {
  label: string;
  count: number;
  icon: CategoryIcon;
  selected: boolean;
  color: string;
  onPress: () => void;
};

function TypeTab({
  label,
  count,
  icon,
  selected,
  color,
  onPress,
}: TypeTabProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="min-h-[75px] min-w-0 flex-1 flex-row items-center gap-3 rounded-[17px] border px-3"
      style={{
        backgroundColor: selected ? `${color}14` : colors.surface,
        borderColor: selected ? color : colors.border,
      }}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-[13px]"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-foreground">
          {label}
        </Text>
        <Text className="mt-1 text-xs text-muted">{count}</Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={18} color={color} />}
    </Pressable>
  );
}

type DraftTypeButtonProps = {
  label: string;
  icon: CategoryIcon;
  selected: boolean;
  color: string;
  onPress: () => void;
};

function DraftTypeButton({
  label,
  icon,
  selected,
  color,
  onPress,
}: DraftTypeButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="min-h-[48px] min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-[13px] border px-2"
      style={{
        backgroundColor: selected ? `${color}14` : colors.surface,
        borderColor: selected ? color : colors.border,
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
