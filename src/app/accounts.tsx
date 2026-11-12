import { Ionicons } from "@expo/vector-icons";
import { vars } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import type {
  Account,
  AccountDraft,
  AccountIcon,
  AccountType,
} from "@/shared/accounts/accountTypes";
import { useAccounts } from "@/shared/context/AccountContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
  type CurrencyCode,
} from "@/shared/lib/currencies";
import { formatCurrency } from "@/shared/lib/format";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getThemeCssVariables } from "@/shared/theme/themeVariables";
import { calculateAccountBalance } from "@/shared/transactions/transactionTypes";
import AppHeader from "@/shared/ui/AppHeader";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";
import { useBottomSheetDismissGesture } from "@/shared/ui/useBottomSheetDismissGesture";

const accountIcons: AccountIcon[] = [
  "card-outline",
  "card",
  "cash-outline",
  "wallet-outline",
  "wallet",
  "business-outline",
  "trending-up-outline",
  "briefcase-outline",
  "phone-portrait-outline",
  "laptop-outline",
  "globe-outline",
  "shield-checkmark-outline",
  "pie-chart-outline",
  "bar-chart-outline",
  "gift-outline",
  "home-outline",
  "car-outline",
  "airplane-outline",
  "basket-outline",
  "bag-handle-outline",
  "cart-outline",
  "restaurant-outline",
  "cafe-outline",
  "flash-outline",
  "water-outline",
  "wifi-outline",
  "headset-outline",
  "camera-outline",
  "film-outline",
  "musical-notes-outline",
  "game-controller-outline",
  "ticket-outline",
  "book-outline",
  "school-outline",
  "heart-outline",
  "medkit-outline",
  "fitness-outline",
  "paw-outline",
  "shirt-outline",
  "leaf-outline",
  "flower-outline",
  "hammer-outline",
  "construct-outline",
  "people-outline",
  "person-outline",
  "calendar-outline",
  "time-outline",
  "rocket-outline",
  "star-outline",
  "sunny-outline",
  "moon-outline",
  "document-text-outline",
  "receipt-outline",
  "repeat-outline",
  "pricetag-outline",
  "key-outline",
  "bed-outline",
  "train-outline",
  "bus-outline",
  "bicycle-outline",
  "ellipsis-horizontal-circle-outline",
  "grid-outline",
];

const accountColors = [
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

const accountTypes: {
  value: AccountType;
  icon: AccountIcon;
  color: string;
}[] = [
  { value: "card", icon: "card-outline", color: "#3B82F6" },
  { value: "cash", icon: "cash-outline", color: "#10B981" },
  { value: "deposit", icon: "trending-up-outline", color: "#8B5CF6" },
];

type AccountsScreenProps = { showBackButton?: boolean };

export default function AccountsScreen({
  showBackButton = true,
}: AccountsScreenProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);
  const isDismissing = useRef(false);

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const closeEditor = () => setEditorVisible(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          editorVisible &&
          !isDismissing.current &&
          scrollOffsetY.current <= 0 &&
          gesture.dy > 6 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onMoveShouldSetPanResponder: (_event, gesture) =>
          editorVisible &&
          !isDismissing.current &&
          scrollOffsetY.current <= 0 &&
          gesture.dy > 6 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_event, gesture) => {
          if (gesture.dy > 0) translateY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (gesture.dy > 110 || gesture.vy > 0.9) {
            isDismissing.current = true;
            Animated.timing(translateY, {
              toValue: 700,
              duration: 180,
              useNativeDriver: Platform.OS !== "web",
            }).start(({ finished }) => {
              if (finished) closeEditor();
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: Platform.OS !== "web",
              damping: 24,
              stiffness: 260,
              mass: 0.8,
            }).start();
          }
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () =>
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: Platform.OS !== "web",
            damping: 24,
            stiffness: 260,
            mass: 0.8,
          }).start(),
      }),
    [editorVisible, translateY],
  );

  const { panGesture: nativeDismissGesture, scrollGesture } =
    useBottomSheetDismissGesture({
      enabled: Platform.OS === "android" && editorVisible,
      translateY,
      scrollOffsetY,
      isDismissing,
      onDismiss: closeEditor,
    });

  const { accounts, addAccount, updateAccount, deleteAccount } = useAccounts();
  const { transactions } = useTransactions();

  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<AccountType>("card");
  const [draftIcon, setDraftIcon] = useState<AccountIcon>("card-outline");
  const [draftColor, setDraftColor] = useState(accountColors[9]);
  const [draftCurrencyCode, setDraftCurrencyCode] = useState<CurrencyCode>(
    DEFAULT_CURRENCY_CODE,
  );
  const [currencySearch, setCurrencySearch] = useState("");
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (editorVisible) {
      translateY.setValue(0);
      scrollOffsetY.current = 0;
      isDismissing.current = false;
    }
  }, [editorVisible, translateY]);

  const currentLanguage =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru" : "en";
  const normalizedCurrencySearch = currencySearch
    .trim()
    .toLocaleLowerCase(currentLanguage);
  const filteredCurrencies = CURRENCIES.filter(
    (item) =>
      item.code.toLocaleLowerCase().includes(normalizedCurrencySearch) ||
      item.symbol.toLocaleLowerCase().includes(normalizedCurrencySearch) ||
      item.name[currentLanguage]
        .toLocaleLowerCase()
        .includes(normalizedCurrencySearch),
  );
  const popularCurrencyCodes = ["KZT", "USD", "EUR", "RUB", "CNY"] as const;
  const isSearchingCurrency = currencySearch.trim().length > 0;
  const popularCurrencies = popularCurrencyCodes.flatMap((code) =>
    filteredCurrencies.filter((item) => item.code === code),
  );
  const visibleCurrencies =
    showAllCurrencies || isSearchingCurrency
      ? filteredCurrencies
      : [
          ...popularCurrencies,
          ...filteredCurrencies.filter(
            (item) =>
              item.code === draftCurrencyCode &&
              !popularCurrencyCodes.includes(
                item.code as (typeof popularCurrencyCodes)[number],
              ),
          ),
        ];

  function openCreateEditor() {
    setEditingId(null);
    setDraftName("");
    setDraftType("card");
    setDraftIcon("card-outline");
    setDraftColor(accountColors[9]);
    setDraftCurrencyCode(DEFAULT_CURRENCY_CODE);
    setCurrencySearch("");
    setShowAllCurrencies(false);
    setNameError(false);
    setEditorVisible(true);
  }

  function openEditEditor(account: Account) {
    setEditingId(account.id);
    setDraftName(account.name);
    setDraftType(account.type);
    setDraftIcon(account.icon);
    setDraftColor(account.color);
    setDraftCurrencyCode(account.currencyCode ?? DEFAULT_CURRENCY_CODE);
    setCurrencySearch("");
    setShowAllCurrencies(false);
    setNameError(false);
    setEditorVisible(true);
  }

  function chooseType(type: AccountType) {
    setDraftType(type);
    const defaults = accountTypes.find((item) => item.value === type);
    if (defaults) {
      setDraftIcon(defaults.icon);
      setDraftColor(defaults.color);
    }
  }

  function saveAccount() {
    const name = draftName.trim();
    if (!name) {
      setNameError(true);
      return;
    }

    const draft: AccountDraft = {
      name,
      type: draftType,
      icon: draftIcon,
      color: draftColor,
      currencyCode: draftCurrencyCode,
    };

    if (editingId) updateAccount(editingId, draft);
    else addAccount(draft);

    setEditorVisible(false);
  }

  function confirmDelete(account: Account) {
    Alert.alert(
      t("accounts.manage.deleteTitle"),
      t("accounts.manage.deleteMessage", { name: account.name }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteAccount(account.id),
        },
      ],
    );
  }

  const editorSheet = (
    <View
      className="rounded-t-[28px] bg-background px-4 pt-4"
      style={{ flexShrink: 1 }}
    >
      <View
        className="items-center justify-center pb-2 pt-3"
        style={{ minHeight: 40 }}
      >
        <View className="h-1.5 w-10 rounded-full bg-muted" />
      </View>
      <View className="flex-row items-center justify-between border-b border-border px-0 pb-4 pt-1">
        <View className="flex-1 pr-3">
          <Text className="text-[21px] font-extrabold text-foreground">
            {editingId
              ? t("accounts.editAccount")
              : t("accounts.manage.newAccount")}
          </Text>
          <Text className="mt-1 text-xs text-muted">
            {t("accounts.manage.editorDescription")}
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

      <GestureDetector gesture={scrollGesture}>
      <ScrollView
        style={{ flexShrink: 1 }}
        onScroll={(event) => {
          scrollOffsetY.current = Math.max(
            0,
            event.nativeEvent.contentOffset.y,
          );
        }}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-5 pb-3"
      >
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">
            {t("accounts.manage.accountType")}
          </Text>
          <View className="flex-row gap-2">
            {accountTypes.map((type) => {
              const selected = draftType === type.value;
              return (
                <Pressable
                  key={type.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => chooseType(type.value)}
                  className="min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border px-2 py-3"
                  style={{
                    backgroundColor: selected
                      ? `${type.color}18`
                      : colors.surface,
                    borderColor: selected ? type.color : colors.border,
                  }}
                >
                  <Ionicons
                    name={type.icon}
                    size={22}
                    color={selected ? type.color : colors.muted}
                  />
                  <Text className="text-center text-xs font-semibold text-foreground">
                    {t(`accounts.types.${type.value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">
            {t("accounts.accountName")}
          </Text>
          <TextInput
            value={draftName}
            onChangeText={(value) => {
              setDraftName(value);
              if (value.trim()) setNameError(false);
            }}
            placeholder={t("accounts.accountNamePlaceholder")}
            placeholderTextColor={colors.subtle}
            maxLength={40}
            returnKeyType="done"
            className={`min-h-[50px] rounded-[14px] border bg-surface px-3 text-[15px] text-foreground ${nameError ? "border-expense" : "border-border"}`}
            accessibilityLabel={t("accounts.accountName")}
          />
          {nameError && (
            <Text className="text-xs text-expense">
              {t("accounts.manage.nameRequired")}
            </Text>
          )}
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm font-semibold text-foreground">
              {t("accounts.manage.currency")}
            </Text>
            <Text className="text-xs font-bold text-accent">
              {draftCurrencyCode}
            </Text>
          </View>
          {editingId &&
          transactions.some(
            (transaction) =>
              transaction.accountId === editingId ||
              transaction.toAccountId === editingId,
          ) ? (
            <Text className="text-xs leading-5 text-muted">
              {t("accounts.manage.currencyLocked")}
            </Text>
          ) : null}
          <TextInput
            value={currencySearch}
            onChangeText={setCurrencySearch}
            placeholder={t("accounts.manage.currencySearch")}
            placeholderTextColor={colors.subtle}
            className="min-h-[44px] rounded-[13px] border border-border bg-surface px-3 text-sm text-foreground"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("accounts.manage.currency")}
          />
          <View className="gap-2">
            {visibleCurrencies.map((item) => {
              const selected = draftCurrencyCode === item.code;
              const locked = Boolean(
                editingId &&
                transactions.some(
                  (transaction) =>
                    transaction.accountId === editingId ||
                    transaction.toAccountId === editingId,
                ),
              );
              return (
                <Pressable
                  key={item.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: locked }}
                  disabled={locked}
                  onPress={() => setDraftCurrencyCode(item.code)}
                  className="min-h-[48px] flex-row items-center gap-3 rounded-[13px] border px-3 py-2"
                  style={{
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected
                      ? colors.accentDark
                      : colors.surface,
                    opacity: locked ? 0.65 : 1,
                  }}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-[10px] bg-surface-raised">
                    <Text className="text-sm font-bold text-foreground">
                      {item.symbol}
                    </Text>
                  </View>
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-xs font-semibold text-foreground">
                      {item.name[currentLanguage]}
                    </Text>
                    <Text className="text-[10px] font-bold tracking-[0.6px] text-subtle">
                      {item.code}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color={colors.accent}
                    />
                  ) : null}
                </Pressable>
              );
            })}
            {filteredCurrencies.length === 0 ? (
              <Text className="text-sm text-muted">
                {t("accounts.manage.noCurrenciesFound")}
              </Text>
            ) : null}
          </View>
          {!isSearchingCurrency && filteredCurrencies.length > 5 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAllCurrencies((value) => !value)}
              className="min-h-[42px] flex-row items-center justify-center gap-2 rounded-[13px] border border-border px-3"
            >
              <Text className="text-xs font-semibold text-accent">
                {showAllCurrencies
                  ? t("accounts.manage.hideAdditionalCurrencies")
                  : t("accounts.manage.showAllCurrencies")}
              </Text>
              <Ionicons
                name={showAllCurrencies ? "chevron-up" : "chevron-down"}
                size={17}
                color={colors.accent}
              />
            </Pressable>
          ) : null}
        </View>

        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">
            {t("accounts.manage.chooseIcon")}
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {accountIcons.map((iconName) => {
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
            {t("accounts.manage.accentColor")}
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {accountColors.map((color) => {
              const selected = draftColor === color;
              return (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t("accounts.manage.colorOption")} ${color}`}
                  onPress={() => setDraftColor(color)}
                  className="h-9 w-[9.5%] items-center justify-center rounded-full border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: selected ? colors.foreground : "transparent",
                  }}
                >
                  {selected && (
                    <Ionicons name="checkmark" size={17} color="#FFFFFF" />
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
              {t("accounts.manage.preview")}
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1 text-sm font-bold text-foreground"
            >
              {draftName.trim() || t("accounts.accountNamePlaceholder")}
            </Text>
            <Text className="mt-1 text-xs text-muted">
              {t(`accounts.types.${draftType}`)}
            </Text>
          </View>
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: draftColor }}
          />
        </View>
      </ScrollView>
      </GestureDetector>

      <View
        className="border-t border-border bg-background px-0 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={saveAccount}
          className="min-h-[52px] items-center justify-center rounded-[15px] bg-accent px-4"
        >
          <Text
            className="text-[15px] font-bold"
            style={{ color: colors.accentContrastText }}
          >
            {t("common.save")}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      {showBackButton ? (
        <AppHeader title={t("accounts.title")} showBackButton />
      ) : null}
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 px-4 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm leading-5 text-muted">
            {t("accounts.description")}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {accountTypes.map((type) => (
              <View
                key={type.value}
                className="flex-1 basis-[30%] items-center gap-2 rounded-[16px] border border-border bg-surface px-2 py-3"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-[13px]"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Ionicons name={type.icon} size={22} color={type.color} />
                </View>
                <Text className="text-center text-xs font-semibold text-foreground">
                  {t(`accounts.types.${type.value}`)}
                </Text>
              </View>
            ))}
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
              {t("accounts.addAccount")}
            </Text>
          </Pressable>

          {accounts.length > 0 ? (
            <View className="gap-3">
              {accounts.map((account) => (
                <View
                  key={account.id}
                  className="rounded-[19px] border border-border bg-surface p-4"
                >
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t("common.edit")}: ${account.name}`}
                      onPress={() => openEditEditor(account)}
                      className="h-[54px] w-[54px] items-center justify-center rounded-[17px]"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Ionicons
                        name={account.icon}
                        size={26}
                        color={account.color}
                      />
                    </Pressable>

                    <View className="min-w-0 flex-1 gap-1">
                      <Text
                        numberOfLines={1}
                        className="text-[15px] font-bold text-foreground"
                      >
                        {account.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        {t(`accounts.types.${account.type}`)} ·{" "}
                        {account.currencyCode}
                      </Text>
                      <Text className="text-sm font-extrabold text-foreground">
                        {formatCurrency(
                          calculateAccountBalance(account.id, transactions),
                          getCurrencyByCode(account.currencyCode),
                        )}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t("common.edit")}: ${account.name}`}
                      hitSlop={5}
                      onPress={() => openEditEditor(account)}
                      className="h-9 w-9 items-center justify-center rounded-[11px]"
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color={colors.muted}
                      />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${t("common.delete")}: ${account.name}`}
                      hitSlop={5}
                      onPress={() => confirmDelete(account)}
                      className="h-9 w-9 items-center justify-center rounded-[11px]"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.subtle}
                      />
                    </Pressable>
                  </View>
                  <View
                    className="mt-4 h-[3px] w-12 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center rounded-[20px] border border-border bg-surface px-6 py-8">
              <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-accent-dark">
                <Ionicons
                  name="wallet-outline"
                  size={26}
                  color={colors.accent}
                />
              </View>
              <Text className="mt-4 text-center text-base font-bold text-foreground">
                {t("accounts.manage.emptyTitle")}
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-muted">
                {t("accounts.manage.emptyDescription")}
              </Text>
            </View>
          )}
        </ScrollView>

        {Platform.OS === "web" ? (
          editorVisible && (
            <GestureHandlerRootView style={{ flex: 1 }}>
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 1000,
                justifyContent: "flex-end",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
                onPress={() => setEditorVisible(false)}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                }}
              />
              <KeyboardAvoidingView
                style={{
                  maxHeight: "100%",
                  justifyContent: "flex-end",
                  zIndex: 1,
                }}
              >
                <GestureDetector gesture={nativeDismissGesture}>
                <Animated.View
                  style={{
                    transform: [{ translateY }],
                    backgroundColor: colors.background,
                    maxHeight: "92%",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    overflow: "hidden",
                  }}
                >
                  {editorSheet}
                </Animated.View>
                </GestureDetector>
              </KeyboardAvoidingView>
            </View>
            </GestureHandlerRootView>
          )
        ) : (
          <Modal
            visible={editorVisible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() => setEditorVisible(false)}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              className="flex-1 justify-end"
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={vars(getThemeCssVariables(colors))}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
                onPress={closeEditor}
                className="absolute inset-0 bg-black/50"
              />
              <GestureDetector gesture={nativeDismissGesture}>
              <Animated.View
                {...(Platform.OS !== "android" ? panResponder.panHandlers : {})}
                style={{
                  transform: [{ translateY }],
                  backgroundColor: colors.background,
                  maxHeight: "92%",
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  overflow: "hidden",
                }}
              >
                {editorSheet}
              </Animated.View>
              </GestureDetector>
            </KeyboardAvoidingView>
            </GestureHandlerRootView>
          </Modal>
        )}
      </SafeAreaView>
    </>
  );
}
