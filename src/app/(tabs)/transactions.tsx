import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

import type { Category } from "@/shared/categories/categoryTypes";
import { useAccounts } from "@/shared/context/AccountContext";
import { useCategories } from "@/shared/context/CategoryContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
} from "@/shared/lib/currencies";
import { formatCurrency } from "@/shared/lib/format";
import { useTheme } from "@/shared/theme/ThemeContext";
import type {
  Transaction,
  TransactionDraft,
  TransactionType,
} from "@/shared/transactions/transactionTypes";

type FilterType = "all" | "income" | "expense" | "transfer";

function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function getDateLabel(
  dateString: string,
  todayLabel: string,
  yesterdayLabel: string,
  locale: string,
): string {
  const date = parseDate(dateString);
  if (!date) return dateString;
  const today = parseDate(localDateString());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = localDateString(yesterday);
  if (dateString === localDateString()) return todayLabel;
  if (dateString === yesterdayString) return yesterdayLabel;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === today?.getFullYear() ? undefined : "numeric",
  }).format(date);
}

export default function TransactionsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ create?: string; type?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftType, setDraftType] = useState<TransactionType>("expense");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftToAmount, setDraftToAmount] = useState("");
  const [draftAccountId, setDraftAccountId] = useState("");
  const [draftToAccountId, setDraftToAccountId] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");
  const [draftDate, setDraftDate] = useState(localDateString());
  const [draftNote, setDraftNote] = useState("");
  const [formError, setFormError] = useState("");

  const locale =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru-KZ" : "en-KZ";
  const draftCategories = categories.filter(
    (category) => category.type === draftType,
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

  const monthTotals = useMemo<
    Record<string, { income: number; expense: number }>
  >(() => {
    const month = localDateString().slice(0, 7);
    const totals: Record<string, { income: number; expense: number }> = {};
    for (const transaction of transactions) {
      if (
        !transaction.date.startsWith(month) ||
        transaction.type === "transfer"
      )
        continue;
      const account = accounts.find(
        (item) => item.id === transaction.accountId,
      );
      if (!account) continue;
      const currencyCode = account.currencyCode ?? DEFAULT_CURRENCY_CODE;
      totals[currencyCode] ??= { income: 0, expense: 0 };
      if (transaction.type === "income")
        totals[currencyCode].income += transaction.amount;
      if (transaction.type === "expense")
        totals[currencyCode].expense += transaction.amount;
    }
    return totals;
  }, [transactions, accounts]);

  const monthTotalEntries = Object.entries(monthTotals) as [
    string,
    { income: number; expense: number },
  ][];

  const monthIncomeDisplay = monthTotalEntries
    .filter(([, totals]) => totals.income > 0)
    .map(
      ([code, totals]) =>
        `${formatCurrency(totals.income, getCurrencyByCode(code))}${Object.keys(monthTotals).length > 1 ? ` · ${code}` : ""}`,
    );
  const monthExpenseDisplay = monthTotalEntries
    .filter(([, totals]) => totals.expense > 0)
    .map(
      ([code, totals]) =>
        `${formatCurrency(totals.expense, getCurrencyByCode(code))}${Object.keys(monthTotals).length > 1 ? ` · ${code}` : ""}`,
    );

  const zeroCurrencyCodes = [
    ...new Set(
      accounts.map((account) => account.currencyCode ?? DEFAULT_CURRENCY_CODE),
    ),
  ];

  if (zeroCurrencyCodes.length === 0) {
    zeroCurrencyCodes.push(DEFAULT_CURRENCY_CODE);
  }

  const zeroAmountDisplay = zeroCurrencyCodes
    .map(
      (code) =>
        `${formatCurrency(0, getCurrencyByCode(code))}${
          zeroCurrencyCodes.length > 1 ? ` · ${code}` : ""
        }`,
    )
    .join("\n");

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    return [...transactions]
      .filter(
        (transaction) =>
          activeFilter === "all" || transaction.type === activeFilter,
      )
      .filter((transaction) => {
        if (!query) return true;
        const account = accounts.find(
          (item) => item.id === transaction.accountId,
        );
        const toAccount = accounts.find(
          (item) => item.id === transaction.toAccountId,
        );
        const category = categories.find(
          (item) => item.id === transaction.categoryId,
        );
        return [
          transaction.note,
          account?.name,
          toAccount?.name,
          category?.name,
        ].some((value) => value?.toLocaleLowerCase(locale).includes(query));
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [transactions, activeFilter, search, locale, accounts, categories]);

  const openCreateEditor = useCallback(
    (type: TransactionType = "expense") => {
      if (accounts.length === 0) {
        router.push("/accounts");
        return;
      }
      setEditingId(null);
      setDraftType(type);
      setDraftAmount("");
      setDraftToAmount("");
      setDraftAccountId(accounts[0]?.id ?? "");
      setDraftToAccountId(accounts[1]?.id ?? "");
      setDraftCategoryId(
        categories.find((category) => category.type === type)?.id ?? "",
      );
      setDraftDate(localDateString());
      setDraftNote("");
      setFormError("");
      setEditorVisible(true);
    },
    [accounts, categories, router],
  );

  useEffect(() => {
    if (params.create !== "1") return;

    const requestedType: TransactionType =
      params.type === "income" || params.type === "transfer"
        ? params.type
        : "expense";

    openCreateEditor(requestedType);
    router.setParams({ create: undefined, type: undefined });
  }, [params.create, params.type, openCreateEditor, router]);

  function openEditEditor(transaction: Transaction) {
    setEditingId(transaction.id);
    setDraftType(transaction.type);
    setDraftAmount(String(transaction.amount));
    setDraftToAmount(String(transaction.toAmount ?? transaction.amount));
    setDraftAccountId(transaction.accountId);
    setDraftToAccountId(
      transaction.toAccountId ??
        accounts.find((item) => item.id !== transaction.accountId)?.id ??
        "",
    );
    setDraftCategoryId(transaction.categoryId ?? "");
    setDraftDate(transaction.date);
    setDraftNote(transaction.note ?? "");
    setFormError("");
    setEditorVisible(true);
  }

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
      const fromAccount = accounts.find(
        (account) => account.id === draftAccountId,
      );
      const toAccount = accounts.find(
        (account) => account.id === draftToAccountId,
      );
      if (
        fromAccount &&
        toAccount &&
        fromAccount.currencyCode !== toAccount.currencyCode
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
    const parsedDate = parseDate(draftDate);
    if (!parsedDate) {
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

    if (editingId) updateTransaction(editingId, draft);
    else addTransaction(draft);
    setEditorVisible(false);
  }

  function confirmDelete(transaction: Transaction) {
    Alert.alert(
      t("transactions.deleteTitle"),
      t("transactions.deleteConfirmation"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteTransaction(transaction.id),
        },
      ],
    );
  }

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: t("transactions.all") },
    { value: "income", label: t("transactions.incomes") },
    { value: "expense", label: t("transactions.expenses") },
    { value: "transfer", label: t("transactions.transfer") },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-sm text-muted">
          {t("transactions.description")}
        </Text>

        <View className="flex-row gap-3">
          <View className="min-w-0 flex-1 rounded-[18px] border border-border bg-surface p-3">
            <View className="mb-2 flex-row items-center gap-1">
              <Ionicons
                name="arrow-down-outline"
                size={16}
                color={colors.income}
              />
              <Text className="text-xs font-semibold text-muted">
                {t("transactions.incomes")}
              </Text>
            </View>
            <Text
              numberOfLines={3}
              adjustsFontSizeToFit
              className="text-base font-extrabold text-foreground"
            >
              {monthIncomeDisplay.length > 0
                ? monthIncomeDisplay.join("\n")
                : zeroAmountDisplay}
            </Text>
          </View>
          <View className="min-w-0 flex-1 rounded-[18px] border border-border bg-surface p-3">
            <View className="mb-2 flex-row items-center gap-1">
              <Ionicons
                name="arrow-up-outline"
                size={16}
                color={colors.expense}
              />
              <Text className="text-xs font-semibold text-muted">
                {t("transactions.expenses")}
              </Text>
            </View>
            <Text
              numberOfLines={3}
              adjustsFontSizeToFit
              className="text-base font-extrabold text-foreground"
            >
              {monthExpenseDisplay.length > 0
                ? monthExpenseDisplay.join("\n")
                : zeroAmountDisplay}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="h-[48px] min-w-0 flex-1 flex-row items-center gap-2 rounded-[15px] border border-border bg-surface px-3">
            <Ionicons name="search-outline" size={20} color={colors.subtle} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("transactions.searchPlaceholder")}
              placeholderTextColor={colors.subtle}
              className="min-w-0 flex-1 py-0 text-sm text-foreground"
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Ionicons name="close-circle" size={19} color={colors.subtle} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("transactions.addTransaction")}
            onPress={() => openCreateEditor()}
            className="h-12 w-12 items-center justify-center rounded-[15px] bg-accent"
          >
            <Ionicons
              name="add"
              size={25}
              color={colors.accentContrastText}
            />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {filterOptions.map((option) => {
            const selected = activeFilter === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setActiveFilter(option.value)}
                className={`rounded-full border px-4 py-[9px] ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
              >
                <Text
                  className={`text-sm font-semibold ${selected ? "text-accent" : "text-muted"}`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {visibleTransactions.length > 0 ? (
          <View className="gap-3">
            {visibleTransactions.map((transaction) => {
              const category = categories.find(
                (item) => item.id === transaction.categoryId,
              );
              const account = accounts.find(
                (item) => item.id === transaction.accountId,
              );
              const toAccount = accounts.find(
                (item) => item.id === transaction.toAccountId,
              );
              const isTransfer = transaction.type === "transfer";
              const icon = isTransfer
                ? "swap-horizontal-outline"
                : (category?.icon ??
                  (transaction.type === "income"
                    ? "trending-up-outline"
                    : "receipt-outline"));
              const iconColor = isTransfer
                ? colors.accent
                : (category?.color ??
                  (transaction.type === "income"
                    ? colors.income
                    : colors.expense));
              const title = isTransfer
                ? `${account?.name ?? t("transactions.unknownAccount")} → ${toAccount?.name ?? t("transactions.unknownAccount")}`
                : transaction.note ||
                  category?.name ||
                  t(`transactions.${transaction.type}`);
              const subtitle = isTransfer
                ? transaction.note || t("transactions.transfer")
                : `${category?.name ?? t("transactions.uncategorized")} · ${account?.name ?? t("transactions.unknownAccount")}`;
              const sourceCurrency = getCurrencyByCode(
                account?.currencyCode ?? DEFAULT_CURRENCY_CODE,
              );
              const destinationCurrency = getCurrencyByCode(
                toAccount?.currencyCode ?? DEFAULT_CURRENCY_CODE,
              );
              const amountPrefix =
                transaction.type === "income"
                  ? "+"
                  : transaction.type === "expense"
                    ? "−"
                    : "";
              const amountColor =
                transaction.type === "income"
                  ? colors.income
                  : transaction.type === "expense"
                    ? colors.expense
                    : colors.foreground;
              const amountLabel =
                isTransfer && sourceCurrency.code !== destinationCurrency.code
                  ? `−${formatCurrency(transaction.amount, sourceCurrency)} → +${formatCurrency(transaction.toAmount ?? transaction.amount, destinationCurrency)}`
                  : `${amountPrefix}${formatCurrency(transaction.amount, sourceCurrency)}`;

              return (
                <Pressable
                  key={transaction.id}
                  accessibilityRole="button"
                  onPress={() => openEditEditor(transaction)}
                  className="rounded-[19px] border border-border bg-surface p-3"
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-[48px] w-[48px] items-center justify-center rounded-[16px]"
                      style={{ backgroundColor: `${iconColor}20` }}
                    >
                      <Ionicons
                        name={icon as keyof typeof Ionicons.glyphMap}
                        size={23}
                        color={iconColor}
                      />
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text
                        numberOfLines={1}
                        className="text-[14px] font-bold text-foreground"
                      >
                        {title}
                      </Text>
                      <Text numberOfLines={1} className="text-xs text-muted">
                        {subtitle}
                      </Text>
                      <Text className="text-[11px] text-subtle">
                        {getDateLabel(
                          transaction.date,
                          t("dates.today"),
                          t("dates.yesterday"),
                          locale,
                        )}
                      </Text>
                    </View>
                    <View className="items-end gap-2">
                      <Text
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        className="max-w-[168px] text-sm font-extrabold"
                        style={{ color: amountColor }}
                      >
                        {amountLabel}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("common.delete")}
                        hitSlop={8}
                        onPress={(event) => {
                          event.stopPropagation();
                          confirmDelete(transaction);
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.subtle}
                        />
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="items-center rounded-[22px] border border-border bg-surface px-6 py-9">
            <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-accent-dark">
              <Ionicons
                name="receipt-outline"
                size={27}
                color={colors.accent}
              />
            </View>
            <Text className="mt-4 text-center text-base font-bold text-foreground">
              {search || activeFilter !== "all"
                ? t("transactions.noResults")
                : t("transactions.emptyTitle")}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-muted">
              {search || activeFilter !== "all"
                ? t("transactions.noResultsDescription")
                : t("transactions.emptyDescription")}
            </Text>
            {!search && activeFilter === "all" ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => openCreateEditor()}
                className="mt-5 flex-row items-center gap-2 rounded-[14px] bg-accent px-4 py-3"
              >
                <Ionicons
                  name="add"
                  size={19}
                  color={colors.accentContrastText}
                />
                <Text
                  className="font-bold"
                  style={{ color: colors.accentContrastText }}
                >
                  {accounts.length === 0
                    ? t("accounts.addAccount")
                    : t("transactions.addTransaction")}
                </Text>
              </Pressable>
            ) : null}
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
            className="max-h-[92%] rounded-t-[26px] border border-border bg-background"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
              <View className="min-w-0 flex-1">
                <Text className="text-lg font-extrabold text-foreground">
                  {editingId
                    ? t("transactions.editTransaction")
                    : t("transactions.addTransaction")}
                </Text>
                <Text className="mt-1 text-xs text-muted">
                  {t("transactions.editorDescription")}
                </Text>
              </View>
              <Pressable
                onPress={() => setEditorVisible(false)}
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
              <View className="flex-row gap-2">
                {(
                  [
                    {
                      value: "expense",
                      label: t("transactions.expense"),
                      icon: "arrow-up-outline",
                    },
                    {
                      value: "income",
                      label: t("transactions.income"),
                      icon: "arrow-down-outline",
                    },
                    {
                      value: "transfer",
                      label: t("transactions.transfer"),
                      icon: "swap-horizontal-outline",
                    },
                  ] as const
                ).map((option) => {
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
                    autoFocus={false}
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
                                ? (accounts.find(
                                    (item) => item.id !== account.id,
                                  )?.id ?? "")
                                : draftToAccountId;
                            setDraftToAccountId(destinationId);
                            const destination = accounts.find(
                              (item) => item.id === destinationId,
                            );
                            setDraftToAmount(
                              destination &&
                                destination.currencyCode ===
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
                {accounts.length === 0 ? (
                  <Pressable
                    onPress={() => {
                      setEditorVisible(false);
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
                </View>
              ) : (
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">
                      {t("transactions.category")}
                    </Text>
                    <Pressable
                      onPress={() => {
                        setEditorVisible(false);
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
                      {draftCategories.map((category: Category) => {
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

              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {t("transactions.date")}
                </Text>
                <TextInput
                  value={draftDate}
                  onChangeText={(value) => {
                    setDraftDate(value);
                    setFormError("");
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.subtle}
                  className="rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-foreground"
                  autoCapitalize="none"
                />
                <Text className="text-xs text-subtle">
                  {t("transactions.dateFormatHint")}
                </Text>
              </View>

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

              {formError ? (
                <Text className="text-sm font-semibold text-expense">
                  {formError}
                </Text>
              ) : null}
            </ScrollView>

            <View className="flex-row gap-3 border-t border-border px-5 py-4">
              <Pressable
                onPress={() => setEditorVisible(false)}
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
    </View>
  );
}
