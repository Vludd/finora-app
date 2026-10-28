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
import TransactionEditorModal from "@/shared/transactions/TransactionEditorModal";
import type {
  Transaction,
  TransactionType,
} from "@/shared/transactions/transactionTypes";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

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
  const { accounts } = useAccounts();
  const { currencyCode } = useCurrency();
  const { categories } = useCategories();
  const { transactions, deleteTransaction } = useTransactions();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [editorInitialType, setEditorInitialType] =
    useState<TransactionType>("expense");

  const locale =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru-KZ" : "en-KZ";

  const monthTotals = useMemo(() => {
    const month = localDateString().slice(0, 7);
    const totals = { income: 0, expense: 0 };

    for (const transaction of transactions) {
      if (
        !transaction.date.startsWith(month) ||
        transaction.type === "transfer"
      ) {
        continue;
      }

      const account = accounts.find(
        (item) => item.id === transaction.accountId,
      );
      if (
        !account ||
        (account.currencyCode ?? DEFAULT_CURRENCY_CODE) !== currencyCode
      ) {
        continue;
      }

      if (transaction.type === "income") totals.income += transaction.amount;
      if (transaction.type === "expense") totals.expense += transaction.amount;
    }

    return totals;
  }, [transactions, accounts, currencyCode]);

  const selectedCurrency = getCurrencyByCode(currencyCode);
  const monthIncomeDisplay = formatCurrency(
    monthTotals.income,
    selectedCurrency,
  );
  const monthExpenseDisplay = formatCurrency(
    monthTotals.expense,
    selectedCurrency,
  );
  const zeroAmountDisplay = formatCurrency(0, selectedCurrency);

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);

    return [...transactions]
      .filter((transaction) => {
        const account = accounts.find(
          (item) => item.id === transaction.accountId,
        );
        const toAccount = accounts.find(
          (item) => item.id === transaction.toAccountId,
        );
        const sourceCurrency = account?.currencyCode ?? DEFAULT_CURRENCY_CODE;
        const destinationCurrency =
          toAccount?.currencyCode ?? DEFAULT_CURRENCY_CODE;

        const matchesCurrency =
          transaction.type === "transfer"
            ? sourceCurrency === currencyCode ||
              Boolean(toAccount && destinationCurrency === currencyCode)
            : sourceCurrency === currencyCode;

        return (
          matchesCurrency &&
          (activeFilter === "all" || transaction.type === activeFilter)
        );
      })
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
  }, [
    transactions,
    activeFilter,
    search,
    locale,
    accounts,
    categories,
    currencyCode,
  ]);

  const openCreateEditor = useCallback(
    (type: TransactionType = "expense") => {
      if (accounts.length === 0) {
        router.push("/accounts");
        return;
      }
      setEditingTransaction(null);
      setEditorInitialType(type);
      setEditorVisible(true);
    },
    [accounts.length, router],
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
    setEditingTransaction(transaction);
    setEditorInitialType(transaction.type);
    setEditorVisible(true);
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
        <View className="gap-1">
          <Text className="text-sm text-muted">
            {t("transactions.description")}
          </Text>
          <Text className="text-xs font-semibold text-subtle">
            {t("transactions.currencyFilter", { currency: currencyCode })}
          </Text>
        </View>

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
              {monthTotals.income > 0 ? monthIncomeDisplay : zeroAmountDisplay}
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
              {monthTotals.expense > 0
                ? monthExpenseDisplay
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
            <Ionicons name="add" size={25} color={colors.accentContrastText} />
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
              const sourceMatchesCurrency =
                sourceCurrency.code === currencyCode;
              const destinationMatchesCurrency =
                Boolean(toAccount) && destinationCurrency.code === currencyCode;
              const amountColor = isTransfer
                ? sourceMatchesCurrency && destinationMatchesCurrency
                  ? colors.foreground
                  : sourceMatchesCurrency
                    ? colors.expense
                    : colors.income
                : transaction.type === "income"
                  ? colors.income
                  : colors.expense;
              const amountLabel = isTransfer
                ? sourceMatchesCurrency && destinationMatchesCurrency
                  ? `−${formatCurrency(transaction.amount, sourceCurrency)} → +${formatCurrency(transaction.toAmount ?? transaction.amount, destinationCurrency)}`
                  : sourceMatchesCurrency
                    ? `−${formatCurrency(transaction.amount, sourceCurrency)}`
                    : `+${formatCurrency(transaction.toAmount ?? transaction.amount, destinationCurrency)}`
                : `${amountPrefix}${formatCurrency(transaction.amount, sourceCurrency)}`;

              return (
                <View
                  key={transaction.id}
                  className="flex-row items-center gap-3 rounded-[19px] border border-border bg-surface p-3"
                >
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openEditEditor(transaction)}
                    className="min-w-0 flex-1 flex-row items-center gap-3"
                  >
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
                  </Pressable>

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
                      onPress={() => confirmDelete(transaction)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.subtle}
                      />
                    </Pressable>
                  </View>
                </View>
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

      <TransactionEditorModal
        visible={editorVisible}
        initialType={editorInitialType}
        transaction={editingTransaction}
        onClose={() => setEditorVisible(false)}
      />
    </View>
  );
}
