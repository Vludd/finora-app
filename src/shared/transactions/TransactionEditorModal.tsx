import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { vars } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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

import { useAccounts } from "@/shared/context/AccountContext";
import { useCategories } from "@/shared/context/CategoryContext";
import { useCurrency } from "@/shared/context/CurrencyContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
} from "@/shared/lib/currencies";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getThemeCssVariables } from "@/shared/theme/themeVariables";
import type {
  Transaction,
  TransactionDraft,
  TransactionType,
} from "@/shared/transactions/transactionTypes";
import DatePickerField from "@/shared/ui/DatePickerField";

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
  const { addTransaction, updateTransaction } = useTransactions();

  const [draftType, setDraftType] = useState<TransactionType>(initialType);
  const [draftAmount, setDraftAmount] = useState("");
  const [draftToAmount, setDraftToAmount] = useState("");
  const [draftAccountId, setDraftAccountId] = useState("");
  const [draftToAccountId, setDraftToAccountId] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftDate, setDraftDate] = useState(localDateString());
  const [draftNote, setDraftNote] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!visible) return;

    if (transaction) {
      setDraftType(transaction.type);
      setDraftAmount(String(transaction.amount));
      setDraftToAmount(String(transaction.toAmount ?? transaction.amount));
      setDraftAccountId(transaction.accountId);
      setDraftToAccountId(
        transaction.toAccountId ??
          accounts.find((account) => account.id !== transaction.accountId)
            ?.id ??
          "",
      );
      setDraftCategoryId(transaction.categoryId ?? "");
      setDraftDate(transaction.date);
      setDraftNote(transaction.note ?? "");
      setFormError("");
      return;
    }

    const preferredAccount = accounts.find(
      (account) =>
        (account.currencyCode ?? DEFAULT_CURRENCY_CODE) === currencyCode,
    );
    const sourceAccount = preferredAccount ?? accounts[0];
    setDraftType(initialType);
    setDraftAmount("");
    setDraftToAmount("");
    setDraftAccountId(sourceAccount?.id ?? "");
    setDraftToAccountId(
      accounts.find((account) => account.id !== sourceAccount?.id)?.id ?? "",
    );
    setDraftCategoryId(
      categories.find((category) => category.type === initialType)?.id ?? "",
    );
    setDraftDate(localDateString());
    setDraftNote("");
    setFormError("");
  }, [visible, initialType, transaction, accounts, categories, currencyCode]);

  const draftCategories = useMemo(
    () => categories.filter((category) => category.type === draftType),
    [categories, draftType],
  );
  const selectedAccount = accounts.find(
    (account) => account.id === draftAccountId,
  );
  const selectedToAccount = accounts.find(
    (account) => account.id === draftToAccountId,
  );
  const isCrossCurrencyTransfer = Boolean(
    draftType === "transfer" &&
    selectedAccount &&
    selectedToAccount &&
    selectedAccount.currencyCode !== selectedToAccount.currencyCode,
  );

  function chooseType(type: TransactionType) {
    setDraftType(type);
    setDraftCategoryId(
      categories.find((category) => category.type === type)?.id ?? "",
    );
    if (type === "transfer") {
      const from = accounts.find((account) => account.id === draftAccountId);
      const to = accounts.find((account) => account.id === draftToAccountId);
      setDraftToAmount(
        from && to && from.currencyCode === to.currencyCode ? draftAmount : "",
      );
    }
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

    let toAmount: number | null = null;
    if (draftType === "transfer") {
      if (
        !draftToAccountId ||
        !accounts.some((account) => account.id === draftToAccountId)
      ) {
        setFormError(t("transactions.validation.destinationRequired"));
        return;
      }
      if (draftToAccountId === draftAccountId) {
        setFormError(t("transactions.validation.differentAccounts"));
        return;
      }
      if (
        selectedAccount &&
        selectedToAccount &&
        selectedAccount.currencyCode !== selectedToAccount.currencyCode
      ) {
        toAmount = Number(draftToAmount.replace(",", ".").trim());
        if (!Number.isFinite(toAmount) || toAmount <= 0) {
          setFormError(t("transactions.validation.destinationAmountRequired"));
          return;
        }
      } else {
        toAmount = amount;
      }
    }

    if (!isValidDate(draftDate)) {
      setFormError(t("transactions.validation.dateRequired"));
      return;
    }

    const draft: TransactionDraft = {
      type: draftType,
      amount,
      toAmount,
      accountId: draftAccountId,
      toAccountId: draftType === "transfer" ? draftToAccountId : null,
      categoryId:
        draftType === "transfer" || !draftCategoryId ? null : draftCategoryId,
      date: draftDate,
      note: draftNote.trim(),
    };
    if (transaction) updateTransaction(transaction.id, draft);
    else addTransaction(draft);
    onClose();
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
    {
      value: "transfer",
      label: t("transactions.transfer"),
      icon: "swap-horizontal-outline",
    },
  ] as const;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/50"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={vars(getThemeCssVariables(colors))}
      >
        <View
          className="max-h-[92%] rounded-t-[26px] border border-border bg-background"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
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
              onPress={onClose}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-xl bg-surface"
            >
              <Ionicons name="close" size={21} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            className="shrink"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 16,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Date */}
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

            {/* Accounts */}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {draftType === "transfer"
                  ? t("transactions.fromAccount")
                  : t("transactions.account")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {accounts.map((account) => {
                  const selected = draftAccountId === account.id;
                  return (
                    <Pressable
                      key={account.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        if (draftAccountId !== account.id) {
                          setDraftAccountId(account.id);
                          const destinationId =
                            draftToAccountId === account.id
                              ? (accounts.find((item) => item.id !== account.id)
                                  ?.id ?? "")
                              : draftToAccountId;
                          setDraftToAccountId(destinationId);
                          const destination = accounts.find(
                            (item) => item.id === destinationId,
                          );
                          setDraftToAmount(
                            destination &&
                              destination.currencyCode === account.currencyCode
                              ? draftAmount
                              : "",
                          );
                        }
                        setFormError("");
                      }}
                      className={`flex-row items-center gap-2 rounded-[13px] border px-3 py-2 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                    >
                      <Ionicons
                        name={account.icon}
                        size={17}
                        color={selected ? colors.accent : account.color}
                      />
                      <View className="min-w-0 gap-0.5">
                        <Text
                          numberOfLines={1}
                          className={`max-w-[150px] text-xs font-semibold ${selected ? "text-accent" : "text-foreground"}`}
                        >
                          {account.name}
                        </Text>
                        <Text className="text-[10px] font-semibold text-subtle">
                          {account.currencyCode}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {accounts.length === 0 ? (
                <Pressable
                  onPress={() => {
                    onClose();
                    router.push("/accounts");
                  }}
                  className="rounded-xl bg-accent-dark p-3"
                >
                  <Text className="text-sm font-semibold text-accent">
                    {t("transactions.createAccountFirst")}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Amount */}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.amount")}
              </Text>
              <View className="flex-row items-center rounded-[15px] border border-border bg-surface px-4">
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
                <Text className="text-sm font-bold text-muted">
                  {
                    getCurrencyByCode(
                      selectedAccount?.currencyCode ?? DEFAULT_CURRENCY_CODE,
                    ).symbol
                  }
                </Text>
              </View>
            </View>

            {isCrossCurrencyTransfer ? (
              <View className="mt-2 gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("transactions.receivedAmount")} (
                  {selectedToAccount?.currencyCode})
                </Text>
                <View className="flex-row items-center rounded-[15px] border border-border bg-surface px-4">
                  <TextInput
                    value={draftToAmount}
                    onChangeText={(value) => {
                      setDraftToAmount(value);
                      setFormError("");
                    }}
                    placeholder="0"
                    placeholderTextColor={colors.subtle}
                    keyboardType="decimal-pad"
                    className="min-w-0 flex-1 py-3 text-[22px] font-extrabold text-foreground"
                  />
                  <Text className="text-sm font-bold text-muted">
                    {
                      getCurrencyByCode(
                        selectedToAccount?.currencyCode ??
                          DEFAULT_CURRENCY_CODE,
                      ).symbol
                    }
                  </Text>
                </View>
                <Text className="text-xs leading-5 text-muted">
                  {t("transactions.transferCurrencyHint")}
                </Text>
              </View>
            ) : null}

            {/* Comment */}

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t("transactions.note")}
              </Text>
              <TextInput
                value={draftNote}
                onChangeText={setDraftNote}
                placeholder={t("transactions.notePlaceholder")}
                placeholderTextColor={colors.subtle}
                className="rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-foreground"
                maxLength={120}
                returnKeyType="done"
              />
            </View>

            {/* Categories */}

            {draftType === "transfer" ? (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("transactions.toAccount")}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {accounts
                    .filter((account) => account.id !== draftAccountId)
                    .map((account) => {
                      const selected = draftToAccountId === account.id;
                      return (
                        <Pressable
                          key={account.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => {
                            if (draftToAccountId !== account.id) {
                              setDraftToAccountId(account.id);
                              setDraftToAmount(
                                selectedAccount?.currencyCode ===
                                  account.currencyCode
                                  ? draftAmount
                                  : "",
                              );
                            }
                            setFormError("");
                          }}
                          className={`flex-row items-center gap-2 rounded-[13px] border px-3 py-2 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                        >
                          <Ionicons
                            name={account.icon}
                            size={17}
                            color={selected ? colors.accent : account.color}
                          />
                          <View className="min-w-0 gap-0.5">
                            <Text
                              numberOfLines={1}
                              className={`max-w-[150px] text-xs font-semibold ${selected ? "text-accent" : "text-foreground"}`}
                            >
                              {account.name}
                            </Text>
                            <Text className="text-[10px] font-semibold text-subtle">
                              {account.currencyCode}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                </View>
              </View>
            ) : (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">
                    {t("transactions.category")}
                  </Text>
                  <Pressable
                    onPress={() => {
                      onClose();
                      router.push("/categories");
                    }}
                  >
                    <Text className="text-xs font-bold text-accent">
                      {t("transactions.manageCategories")}
                    </Text>
                  </Pressable>
                </View>
                {draftCategories.length > 0 ? (
                  <View className="flex-row flex-wrap gap-2">
                    {draftCategories.map((category) => {
                      const selected = draftCategoryId === category.id;
                      return (
                        <Pressable
                          key={category.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => setDraftCategoryId(category.id)}
                          className={`flex-row items-center gap-2 rounded-[13px] border px-3 py-2 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                        >
                          <Ionicons
                            name={category.icon}
                            size={17}
                            color={selected ? colors.accent : category.color}
                          />
                          <Text
                            numberOfLines={1}
                            className={`max-w-[155px] text-xs font-semibold ${selected ? "text-accent" : "text-foreground"}`}
                          >
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <Text className="text-sm leading-5 text-muted">
                    {t("transactions.noCategories")}
                  </Text>
                )}
              </View>
            )}

            {formError ? (
              <Text className="text-sm font-semibold text-expense">
                {formError}
              </Text>
            ) : null}
          </ScrollView>

          <View className="flex-row gap-3 border-t border-border px-5 py-4">
            <Pressable
              onPress={onClose}
              className="min-h-[50px] flex-1 items-center justify-center rounded-[15px] border border-border bg-surface"
            >
              <Text className="font-bold text-foreground">
                {t("common.cancel")}
              </Text>
            </Pressable>
            <Pressable
              onPress={saveTransaction}
              className="min-h-[50px] flex-1 items-center justify-center rounded-[15px] bg-accent"
            >
              <Text
                className="font-bold"
                style={{ color: colors.accentContrastText }}
              >
                {t("common.save")}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
