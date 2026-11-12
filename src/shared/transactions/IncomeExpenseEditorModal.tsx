import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { vars } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";

import { useAccounts } from "@/shared/context/AccountContext";
import { useCategories } from "@/shared/context/CategoryContext";
import { useCurrency } from "@/shared/context/CurrencyContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
} from "@/shared/lib/currencies";
import { formatCurrency } from "@/shared/lib/format";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getThemeCssVariables } from "@/shared/theme/themeVariables";
import {
  calculateAccountBalance,
  type Transaction,
  type TransactionDraft,
  type TransactionType,
} from "@/shared/transactions/transactionTypes";
import DatePickerField from "@/shared/ui/DatePickerField";
import { useBottomSheetDismissGesture } from "@/shared/ui/useBottomSheetDismissGesture";

type TransactionEditorModalProps = {
  visible: boolean;
  initialType: TransactionType;
  transaction?: Transaction | null;
  onClose: () => void;
};

function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function TransactionEditorModal({
  visible,
  initialType,
  transaction = null,
  onClose,
}: TransactionEditorModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { currencyCode } = useCurrency();
  const { transactions, addTransaction, updateTransaction } = useTransactions();

  const [draftType, setDraftType] = useState<TransactionType>(initialType);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftAccountId, setDraftAccountId] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftDate, setDraftDate] = useState(localDateString());
  const [draftNote, setDraftNote] = useState("");
  const [formError, setFormError] = useState("");
  const [accountPickerVisible, setAccountPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollOffsetY = useRef(0);
  const isDismissing = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const browserHistoryEntry = useRef(false);
  const suppressPopState = useRef(false);

  // Treat browser/device Back as a modal dismissal while the editor is open.
  // A temporary same-URL history entry prevents Expo Router from popping the
  // underlying screen first.
  useEffect(() => {
    if (!visible || Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    suppressPopState.current = false;
    window.history.pushState(
      { finoraTransactionModal: true },
      "",
      window.location.href,
    );
    browserHistoryEntry.current = true;

    const handlePopState = () => {
      if (suppressPopState.current) {
        suppressPopState.current = false;
        browserHistoryEntry.current = false;
        return;
      }

      if (browserHistoryEntry.current) {
        browserHistoryEntry.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      // If the modal was dismissed by another action, consume its history
      // entry so the next Back action does not appear to do nothing.
      if (browserHistoryEntry.current) {
        suppressPopState.current = true;
        window.history.back();
        browserHistoryEntry.current = false;
      }
    };
  }, [visible]);

  function closeModal() {
    if (
      Platform.OS === "web" &&
      browserHistoryEntry.current &&
      typeof window !== "undefined"
    ) {
      suppressPopState.current = true;
      browserHistoryEntry.current = false;
      window.history.back();
    }
    onCloseRef.current();
  }

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      isDismissing.current = false;
    }
  }, [visible, translateY]);

  const dismissPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_event, gestureState) =>
          visible &&
          !isDismissing.current &&
          scrollOffsetY.current <= 0 &&
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          visible &&
          !isDismissing.current &&
          scrollOffsetY.current <= 0 &&
          gestureState.dy > 6 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderMove: (_event, gestureState) => {
          if (gestureState.dy > 0) {
            translateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_event, gestureState) => {
          const shouldDismiss = gestureState.dy > 110 || gestureState.vy > 0.9;

          if (shouldDismiss) {
            isDismissing.current = true;
            Animated.timing(translateY, {
              toValue: 700,
              duration: 180,
              useNativeDriver: Platform.OS !== "web",
            }).start(({ finished }) => {
              if (finished) closeModal();
            });
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: Platform.OS !== "web",
            damping: 24,
            stiffness: 260,
            mass: 0.8,
          }).start();
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: Platform.OS !== "web",
            damping: 24,
            stiffness: 260,
            mass: 0.8,
          }).start();
        },
      }),
    [translateY, visible],
  );

  const { panGesture: nativeDismissGesture, scrollGesture } =
    useBottomSheetDismissGesture({
      enabled: Platform.OS === "android" && visible,
      translateY,
      scrollOffsetY,
      isDismissing,
      onDismiss: closeModal,
    });
  const [amountInputGesture, noteInputGesture] = useMemo(
    () => [
      Gesture.Native().simultaneousWithExternalGesture(nativeDismissGesture),
      Gesture.Native().simultaneousWithExternalGesture(nativeDismissGesture),
    ],
    [nativeDismissGesture],
  );

  useEffect(() => {
    if (!visible) return;

    if (transaction) {
      setDraftType(transaction.type);
      setDraftAmount(String(transaction.amount));
      setDraftAccountId(transaction.accountId);
      setDraftCategoryId(transaction.categoryId ?? "");
      setDraftDate(transaction.date);
      setDraftNote(transaction.note ?? "");
      setFormError("");
      return;
    }

    let active = true;
    const chooseDefaultAccount = async () => {
      let rememberedId = "";
      try {
        rememberedId =
          (await AsyncStorage.getItem("@finora/last-used-account")) ?? "";
      } catch {}
      if (!active) return;
      const remembered = accounts.find(
        (account) => account.id === rememberedId,
      );
      const preferred = accounts.find(
        (account) =>
          (account.currencyCode ?? DEFAULT_CURRENCY_CODE) === currencyCode,
      );
      const sourceAccount = remembered ?? preferred ?? accounts[0];
      setDraftType(initialType);
      setDraftAmount("");
      setDraftAccountId(sourceAccount?.id ?? "");
      setDraftCategoryId(
        categories.find((category) => category.type === initialType)?.id ?? "",
      );
      setDraftDate(localDateString());
      setDraftNote("");
      setFormError("");
    };
    void chooseDefaultAccount();
    return () => {
      active = false;
    };
  }, [visible, initialType, transaction, accounts, categories, currencyCode]);

  const draftCategories = useMemo(
    () => categories.filter((category) => category.type === draftType),
    [categories, draftType],
  );
  const selectedAccount = accounts.find(
    (account) => account.id === draftAccountId,
  );
  const selectedAccountBalance = selectedAccount
    ? (() => {
        let balance = calculateAccountBalance(selectedAccount.id, transactions);

        // When editing, show the balance as it was before the original
        // transaction was applied, so the displayed amount is not misleading.
        if (transaction?.accountId === selectedAccount.id) {
          if (transaction.type === "income") balance -= transaction.amount;
          else balance += transaction.amount;
        }

        return balance;
      })()
    : null;
  function chooseType(type: TransactionType) {
    setDraftType(type);
    setDraftCategoryId(
      categories.find((category) => category.type === type)?.id ?? "",
    );
    setFormError("");
  }

  function saveTransaction() {
    const amount = Number(draftAmount.replace(",", ".").trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError(t("validation.amountMustBePositive"));
      return;
    }
    if (
      !draftAccountId ||
      !accounts.some((account) => account.id === draftAccountId)
    ) {
      setFormError(t("transactions.validation.accountRequired"));
      return;
    }

    if (!isValidDate(draftDate)) {
      setFormError(t("transactions.validation.dateRequired"));
      return;
    }

    const draft: TransactionDraft = {
      type: draftType,
      amount,
      toAmount: null,
      accountId: draftAccountId,
      toAccountId: null,
      categoryId: draftCategoryId || null,
      date: draftDate,
      note: draftNote.trim(),
    };
    if (transaction) updateTransaction(transaction.id, draft);
    else addTransaction(draft);
    void AsyncStorage.setItem(
      "@finora/last-used-account",
      draftAccountId,
    ).catch(() => {});
    closeModal();
  }

  const typeOptions = [
    {
      value: "income",
      label: t("transactions.income"),
      icon: "arrow-down-outline",
    },
    {
      value: "expense",
      label: t("transactions.expense"),
      icon: "arrow-up-outline",
    },
  ] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={vars(getThemeCssVariables(colors))}
      >
        <Pressable
          className="absolute inset-0"
          onPress={closeModal}
          accessibilityRole="button"
          accessibilityLabel={t("common.cancel")}
        />
        <GestureDetector gesture={nativeDismissGesture}>
        <Animated.View
          {...(Platform.OS !== "android" ? dismissPanResponder.panHandlers : {})}
          className="max-h-[92%] rounded-t-[26px] border border-border bg-background"
          style={{
            // Modal is rendered in a portal on Web; set the surface colors
            // explicitly so the animated wrapper never falls back to transparent.
            backgroundColor: colors.background,
            borderColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center justify-center pb-2 pt-3" style={{ minHeight: 40 }}
          >
            <View className="h-1.5 w-10 rounded-full bg-muted" />
          </View>
          <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-extrabold text-foreground">
                {transaction
                  ? t("transactions.editTransaction")
                  : t("transactions.addTransaction")}
              </Text>
              <Text className="mt-1 text-xs text-muted">
                {t("transactions.editorDescription")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
              onPress={closeModal}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-xl bg-surface"
            >
              <Ionicons name="close" size={21} color={colors.foreground} />
            </Pressable>
          </View>

          <GestureDetector gesture={scrollGesture}>
          <ScrollView
            className="shrink"
            onScroll={(event) => {
              scrollOffsetY.current = Math.max(0, event.nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 16,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Transaction type */}

            <View className="flex-row gap-2">
              {typeOptions.map((option) => {
                const selected = draftType === option.value;
                const tone =
                  option.value === "income"
                    ? colors.income
                    : option.value === "expense"
                      ? colors.expense
                      : colors.accent;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => chooseType(option.value)}
                    className={`min-w-0 flex-1 items-center gap-1 rounded-[14px] border px-2 py-3 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                  >
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={selected ? tone : colors.subtle}
                    />
                    <Text
                      numberOfLines={1}
                      className={`text-xs font-bold ${selected ? "text-accent" : "text-muted"}`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Amount */}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.amount")}
              </Text>
              <View className="flex-row items-center rounded-[15px] border border-border bg-surface px-4">
                <GestureDetector gesture={amountInputGesture}>
                <TextInput
                  value={draftAmount}
                  onChangeText={(value) => {
                    setDraftAmount(value);
                    setFormError("");
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.subtle}
                  keyboardType="decimal-pad"
                  className="min-w-0 flex-1 py-3 text-[24px] font-extrabold text-foreground"
                />
                </GestureDetector>
                <Text className="text-sm font-bold text-muted">
                  {
                    getCurrencyByCode(
                      selectedAccount?.currencyCode ?? DEFAULT_CURRENCY_CODE,
                    ).symbol
                  }
                </Text>
              </View>
            </View>

            {/* Accounts */}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.account")}
              </Text>
              {accounts.length !== 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setAccountPickerVisible(true)}
                  className="flex-row items-center gap-3 rounded-[14px] border border-border bg-surface px-3 py-3"
                >
                  {selectedAccount ? (
                    <Ionicons
                      name={selectedAccount.icon}
                      size={20}
                      color={selectedAccount.color}
                    />
                  ) : (
                    <Ionicons
                      name="wallet-outline"
                      size={20}
                      color={colors.subtle}
                    />
                  )}
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text
                      numberOfLines={1}
                      className="text-sm font-semibold text-foreground"
                    >
                      {selectedAccount?.name ?? t("transactions.selectAccount")}
                    </Text>
                    <Text className="text-xs text-muted">
                      {selectedAccount
                        ? `${selectedAccount.currencyCode} · ${t("transactions.currentBalance")}`
                        : t("transactions.chooseAccountHint")}
                    </Text>
                  </View>
                  <Text className="text-sm font-extrabold text-foreground">
                    {selectedAccount && selectedAccountBalance !== null
                      ? formatCurrency(
                          selectedAccountBalance,
                          getCurrencyByCode(
                            selectedAccount.currencyCode ??
                              DEFAULT_CURRENCY_CODE,
                          ),
                        )
                      : ""}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={colors.subtle}
                  />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    closeModal();
                    router.push("/accounts");
                  }}
                  className="rounded-xl bg-accent-dark p-3"
                >
                  <Text className="text-sm font-semibold text-accent">
                    {t("transactions.createAccountFirst")}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Category selector */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.category")}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCategoryPickerVisible(true)}
                className="flex-row items-center gap-3 rounded-[14px] border border-border bg-surface px-3 py-3"
              >
                {categories.find((item) => item.id === draftCategoryId) ? (
                  <Ionicons
                    name={
                      categories.find((item) => item.id === draftCategoryId)!
                        .icon
                    }
                    size={19}
                    color={
                      categories.find((item) => item.id === draftCategoryId)!
                        .color
                    }
                  />
                ) : (
                  <Ionicons
                    name="pricetag-outline"
                    size={19}
                    color={colors.subtle}
                  />
                )}
                <Text className="flex-1 text-sm font-semibold text-foreground">
                  {categories.find((item) => item.id === draftCategoryId)
                    ?.name ?? t("transactions.selectCategory")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={colors.subtle}
                />
              </Pressable>
            </View>

            {/* Date and note are secondary details */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.date")}
              </Text>
              <DatePickerField
                value={draftDate}
                onChange={(value) => {
                  setDraftDate(value);
                  setFormError("");
                }}
                label={t("transactions.date")}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.note")}
              </Text>
              <GestureDetector gesture={noteInputGesture}>
              <TextInput
                value={draftNote}
                onChangeText={setDraftNote}
                placeholder={t("transactions.notePlaceholder")}
                placeholderTextColor={colors.subtle}
                className="rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-foreground"
                maxLength={120}
                returnKeyType="done"
              />
              </GestureDetector>
            </View>

            {formError ? (
              <Text className="text-sm font-semibold text-expense">
                {formError}
              </Text>
            ) : null}
          </ScrollView>
          </GestureDetector>

          <View className="border-t border-border px-5 py-4">
            <Pressable
              onPress={saveTransaction}
              className="min-h-[50px] items-center justify-center rounded-[15px] bg-accent"
            >
              <Text
                className="font-bold"
                style={{ color: colors.accentContrastText }}
              >
                {transaction
                  ? t("transactions.saveChanges")
                  : t("transactions.addAction")}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>

      <Modal
        visible={accountPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAccountPickerVisible(false)}
      >
        <View
          className="flex-1 justify-end bg-black/50"
          style={vars(getThemeCssVariables(colors))}
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setAccountPickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
          />
          <View
            className="max-h-[75%] rounded-t-[24px] border border-border bg-background p-5"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-foreground">
                {t("transactions.selectAccount")}
              </Text>
              <Pressable onPress={() => setAccountPickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {accounts.map((account) => {
                const balance = calculateAccountBalance(
                  account.id,
                  transactions,
                );
                const selected = account.id === draftAccountId;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => {
                      setDraftAccountId(account.id);
                      setAccountPickerVisible(false);
                      setFormError("");
                    }}
                    className={`mb-2 flex-row items-center gap-3 rounded-xl border p-3 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                  >
                    <Ionicons
                      name={account.icon}
                      size={21}
                      color={account.color}
                    />
                    <View className="flex-1 gap-0.5">
                      <Text className="font-semibold text-foreground">
                        {account.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        {account.currencyCode}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-foreground">
                      {formatCurrency(
                        balance,
                        getCurrencyByCode(
                          account.currencyCode ?? DEFAULT_CURRENCY_CODE,
                        ),
                      )}
                    </Text>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        color={colors.accent}
                        size={19}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View
          className="flex-1 justify-end bg-black/50"
          style={vars(getThemeCssVariables(colors))}
        >
          <Pressable
            className="absolute inset-0"
            onPress={() => setCategoryPickerVisible(false)}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
          />
          <View
            className="max-h-[75%] rounded-t-[24px] border border-border bg-background p-5"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.border,
            }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-foreground">
                {t("transactions.selectCategory")}
              </Text>
              <Pressable onPress={() => setCategoryPickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                paddingBottom: 4,
              }}
            >
              {draftCategories.map((category) => {
                const selected = category.id === draftCategoryId;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      setDraftCategoryId(category.id);
                      setCategoryPickerVisible(false);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    className={`relative mb-2 w-[48.5%] min-h-[104px] items-center justify-center gap-2 rounded-xl border px-3 py-4 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                  >
                    <Ionicons
                      name={category.icon}
                      size={25}
                      color={category.color}
                    />
                    <Text
                      numberOfLines={2}
                      className="w-full text-center text-sm font-semibold text-foreground"
                    >
                      {category.name}
                    </Text>
                    {selected ? (
                      <View className="absolute right-2 top-2">
                        <Ionicons
                          name="checkmark-circle"
                          color={colors.accent}
                          size={18}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
              {draftCategories.length === 0 ? (
                <Text className="w-full py-4 text-sm text-muted">
                  {t("transactions.noCategories")}
                </Text>
              ) : null}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setCategoryPickerVisible(false);
                closeModal();
                setTimeout(() => router.push("/categories"), 350);
              }}
              className="mt-2 min-h-10 flex-row items-center justify-center gap-2 py-2 active:opacity-60"
              hitSlop={8}
            >
              <Ionicons
                name="settings-outline"
                size={16}
                color={colors.subtle}
              />
              <Text className="text-sm font-semibold text-muted">
                {t("transactions.manageCategories")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.subtle}
              />
            </Pressable>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
