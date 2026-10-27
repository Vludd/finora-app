import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAccounts } from "@/shared/context/AccountContext";
import { useCategories } from "@/shared/context/CategoryContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
  type CurrencyCode,
} from "@/shared/lib/currencies";
import { formatCurrency } from "@/shared/lib/format";
import { useTheme } from "@/shared/theme/ThemeContext";
import type { TransactionType } from "@/shared/transactions/transactionTypes";
import { calculateAccountBalance } from "@/shared/transactions/transactionTypes";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";

type IconName = keyof typeof Ionicons.glyphMap;
type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type WeeklySpendingItem = {
  day: WeekdayKey;
  value: number;
  highlighted: boolean;
};

const weekdayKeys: WeekdayKey[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

function localDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTransactionDateLabel(
  dateString: string,
  todayLabel: string,
  yesterdayLabel: string,
  locale: string,
): string {
  if (dateString === localDateString()) return todayLabel;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateString === localDateString(yesterday)) return yesterdayLabel;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: year === new Date().getFullYear() ? undefined : "numeric",
  }).format(date);
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [weeklyCurrencyCode, setWeeklyCurrencyCode] =
    useState<CurrencyCode | null>(null);
  const locale =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru-KZ" : "en-KZ";

  const balanceByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const account of accounts) {
      const code = account.currencyCode ?? DEFAULT_CURRENCY_CODE;
      totals[code] =
        (totals[code] ?? 0) + calculateAccountBalance(account.id, transactions);
    }
    return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b));
  }, [accounts, transactions]);

  const monthTotals = useMemo<
    Record<string, { income: number; expense: number }>
  >(() => {
    const currentMonth = localDateString().slice(0, 7);
    const totals: Record<string, { income: number; expense: number }> = {};
    for (const transaction of transactions) {
      if (
        !transaction.date.startsWith(currentMonth) ||
        transaction.type === "transfer"
      )
        continue;
      const account = accounts.find(
        (item) => item.id === transaction.accountId,
      );
      if (!account) continue;
      const code = account.currencyCode ?? DEFAULT_CURRENCY_CODE;
      totals[code] ??= { income: 0, expense: 0 };
      if (transaction.type === "income")
        totals[code].income += transaction.amount;
      if (transaction.type === "expense")
        totals[code].expense += transaction.amount;
    }
    return totals;
  }, [transactions, accounts]);

  const monthTotalEntries = Object.entries(monthTotals) as [
    string,
    { income: number; expense: number },
  ][];
  const summaryCurrencyCodes = Array.from(
    new Set(
      accounts.map((account) => account.currencyCode ?? DEFAULT_CURRENCY_CODE),
    ),
  );
  if (summaryCurrencyCodes.length === 0) {
    summaryCurrencyCodes.push(DEFAULT_CURRENCY_CODE);
  }

  const monthIncomeAmounts = monthTotalEntries
    .filter(([, totals]) => totals.income > 0)
    .map(
      ([code, totals]) =>
        `${formatCurrency(totals.income, getCurrencyByCode(code), !balanceVisible)}${Object.keys(monthTotals).length > 1 ? ` · ${code}` : ""}`,
    );
  const monthExpenseAmounts = monthTotalEntries
    .filter(([, totals]) => totals.expense > 0)
    .map(
      ([code, totals]) =>
        `${formatCurrency(totals.expense, getCurrencyByCode(code), !balanceVisible)}${Object.keys(monthTotals).length > 1 ? ` · ${code}` : ""}`,
    );

  const zeroSummaryAmounts = summaryCurrencyCodes.map(
    (code) =>
      `${formatCurrency(0, getCurrencyByCode(code), !balanceVisible)}${summaryCurrencyCodes.length > 1 ? ` · ${code}` : ""}`,
  );
  const displayedMonthIncomeAmounts =
    monthIncomeAmounts.length > 0 ? monthIncomeAmounts : zeroSummaryAmounts;
  const displayedMonthExpenseAmounts =
    monthExpenseAmounts.length > 0 ? monthExpenseAmounts : zeroSummaryAmounts;

  const availableCurrencyCodes = Array.from(
    new Set(accounts.map((account) => account.currencyCode)),
  );
  const activeWeeklyCurrencyCode =
    weeklyCurrencyCode && availableCurrencyCodes.includes(weeklyCurrencyCode)
      ? weeklyCurrencyCode
      : (availableCurrencyCodes[0] ?? DEFAULT_CURRENCY_CODE);

  const weeklySpending = useMemo<WeeklySpendingItem[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateKey = localDateString(date);
      const value = transactions.reduce((total, transaction) => {
        if (transaction.type !== "expense" || transaction.date !== dateKey)
          return total;
        const account = accounts.find(
          (item) => item.id === transaction.accountId,
        );
        return account?.currencyCode === activeWeeklyCurrencyCode
          ? total + transaction.amount
          : total;
      }, 0);
      return {
        day: weekdayKeys[date.getDay()],
        value,
        highlighted: index === 6,
      };
    });
  }, [transactions, accounts, activeWeeklyCurrencyCode]);

  const weeklyTotal = weeklySpending.reduce(
    (total, item) => total + item.value,
    0,
  );
  const weeklyMax = Math.max(1, ...weeklySpending.map((item) => item.value));

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort(
          (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
        )
        .slice(0, 4),
    [transactions],
  );

  const openTransactions = () => {
    router.push("/(tabs)/transactions");
  };

  const openQuickTransaction = (type: TransactionType) => {
    router.push({
      pathname: "/(tabs)/transactions",
      params: { create: "1", type },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-4" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[560px] self-center px-4 pt-2">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[25px] font-extrabold tracking-[-0.8px] text-foreground">
              {t("home.title")}
            </Text>

            <View
              className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface"
              accessibilityLabel={t("common.notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color={colors.foreground}
              />
            </View>
          </View>

          <View className="relative overflow-hidden rounded-[25px] border border-hero-border bg-hero p-6">
            <View className="absolute -top-[85px] right-[-45px] h-[220px] w-[220px] rounded-full bg-hero-decoration opacity-60" />

            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold tracking-[1.5px] text-hero-label">
                {balanceByCurrency.length > 1
                  ? t("home.balanceByCurrency")
                  : t("home.totalBalance")}
              </Text>

              <Pressable
                onPress={() => setBalanceVisible((value) => !value)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={
                  balanceVisible
                    ? t("common.hideBalance")
                    : t("common.showBalance")
                }
              >
                <Ionicons
                  name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={21}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <View className="mt-3 gap-1">
              {balanceByCurrency.length > 0 ? (
                balanceByCurrency.map(([code, amount], index) => (
                  <Text
                    key={code}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    className={`${index === 0 ? "text-[30px] tracking-[-1px]" : "text-[20px] tracking-[-0.4px]"} font-extrabold text-foreground`}
                  >
                    {formatCurrency(
                      amount,
                      getCurrencyByCode(code),
                      !balanceVisible,
                    )}
                    {balanceByCurrency.length > 1 ? ` · ${code}` : ""}
                  </Text>
                ))
              ) : (
                <Text className="text-[30px] font-extrabold tracking-[-1px] text-foreground">
                  {formatCurrency(
                    0,
                    getCurrencyByCode(DEFAULT_CURRENCY_CODE),
                    !balanceVisible,
                  )}
                </Text>
              )}
            </View>

            <View
              className="my-2"
              style={{
                height: 1,
                backgroundColor: colors.border,
                opacity: 1,
              }}
            />

            <View className="flex-row gap-3 justify-between pt-4">
              <SummarySection
                title={t("home.income")}
                amounts={displayedMonthIncomeAmounts}
                period={t("home.thisMonth")}
                icon="arrow-down-outline"
                color={colors.accent}
                iconBackground={colors.incomeSurface}
              />

              <View
                className="mx-4"
                style={{
                  width: 1,
                  backgroundColor: colors.border,
                  opacity: 1,
                }}
              />

              <SummarySection
                title={t("home.expenses")}
                amounts={displayedMonthExpenseAmounts}
                period={t("home.thisMonth")}
                icon="arrow-up-outline"
                color={colors.expense}
                iconBackground={colors.expenseSurface}
              />
            </View>

            <View className="absolute bottom-[-42px] right-[-5px]">
              <View className="h-[105px] w-[105px] rounded-[53px] border border-hero-line opacity-50" />
              <View className="absolute left-[17px] top-[17px] h-[71px] w-[71px] rounded-[36px] border border-hero-line opacity-60" />
            </View>
          </View>

          <View className="mt-4 gap-3">
            <Text className="mb-1 text-[17px] font-extrabold tracking-[-0.35px] text-foreground">
              {t("home.quickActions")}
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <QuickAction
                  icon="add-outline"
                  title={t("home.addIncome")}
                  onPress={() => openQuickTransaction("income")}
                  contrastText={colors.accentContrastText}
                  accentColor={colors.accent}
                  compact
                  large
                  tone="income"
                  toneColor={colors.income}
                  toneSurface={colors.incomeSurface}
                />
              </View>

              <View className="flex-1">
                <QuickAction
                  icon="remove-outline"
                  title={t("home.addExpense")}
                  onPress={() => openQuickTransaction("expense")}
                  contrastText={colors.accentContrastText}
                  accentColor={colors.accent}
                  compact
                  large
                  tone="expense"
                  toneColor={colors.expense}
                  toneSurface={colors.expenseSurface}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <QuickAction
                  icon="swap-horizontal-outline"
                  title={t("home.transfer")}
                  onPress={() => openQuickTransaction("transfer")}
                  contrastText={colors.accentContrastText}
                  accentColor={colors.accent}
                  compact
                />
              </View>

              {/* Additional buttons: */}
              {/* <View className="flex-1"></View> */}
            </View>
          </View>

          <View className="mt-4">
            {availableCurrencyCodes.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
              >
                {availableCurrencyCodes.map((code) => {
                  const selected = code === activeWeeklyCurrencyCode;
                  return (
                    <Pressable
                      key={code}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setWeeklyCurrencyCode(code)}
                      className={`rounded-full border px-3 py-2 ${selected ? "border-accent bg-accent-dark" : "border-border bg-surface"}`}
                    >
                      <Text
                        className={`text-xs font-bold ${selected ? "text-accent" : "text-muted"}`}
                      >
                        {code}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-[17px] font-extrabold tracking-[-0.35px] text-foreground">
                  {t("home.weeklySpending")}
                </Text>
                <Text className="mt-1 text-xs text-subtle">
                  {t("home.last7Days")}
                </Text>
              </View>

              <View className="items-end">
                <Text className="text-[11px] text-subtle">
                  {t("home.chartTotal")}
                </Text>
                <Text className="mt-1 text-[15px] font-extrabold text-foreground">
                  {formatCurrency(
                    weeklyTotal,
                    getCurrencyByCode(activeWeeklyCurrencyCode),
                    !balanceVisible,
                  )}
                </Text>
              </View>
            </View>

            <View className="rounded-[21px] border border-border bg-surface px-4 pb-3 pt-4">
              <View className="flex-row justify-between gap-2">
                {weeklySpending.map((item) => (
                  <View key={item.day} className="flex-1 items-center gap-2">
                    <View className="h-[94px] w-full max-w-[31px] justify-end overflow-hidden rounded-[9px] bg-surface-raised">
                      <View
                        className="w-full rounded-[9px]"
                        style={{
                          height:
                            item.value > 0
                              ? `${Math.max((item.value / weeklyMax) * 100, 6)}%`
                              : "0%",
                          backgroundColor: item.highlighted
                            ? colors.accent
                            : colors.chartBar,
                        }}
                      />
                    </View>

                    <Text
                      className={`text-[11px] font-semibold ${
                        item.highlighted
                          ? "text-accent font-extrabold"
                          : "text-subtle"
                      }`}
                    >
                      {t(`weekdays.${item.day}`)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummarySection({
  title,
  amounts,
  period,
  icon,
  color,
  iconBackground,
}: {
  title: string;
  amounts: string[];
  period: string;
  icon: IconName;
  color: string;
  iconBackground: string;
}) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-2">
        <View
          className="h-[34px] w-[34px] items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBackground }}
        >
          <Ionicons name={icon} size={19} color={color} />
        </View>

        <Text className="text-xs font-semibold text-muted">{title}</Text>
      </View>

      <View className="mt-2 gap-1">
        {amounts.length > 0 ? (
          amounts.map((amount, index) => (
            <Text
              key={`${amount}-${index}`}
              numberOfLines={1}
              adjustsFontSizeToFit
              className={`${index === 0 ? "text-xl" : "text-sm"} font-extrabold tracking-[-0.3px]`}
              style={{ color }}
            >
              {amount}
            </Text>
          ))
        ) : (
          <Text className="text-xl font-extrabold text-muted">—</Text>
        )}
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  onPress,
  contrastText,
  accentColor,
  primary = false,
  compact = false,
  large = false,
  tone = "default",
  toneColor,
  toneSurface,
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
  contrastText: string;
  accentColor: string;
  primary?: boolean;
  compact?: boolean;
  large?: boolean;
  tone?: "default" | "expense" | "income";
  toneColor?: string;
  toneSurface?: string;
}) {
  const hasTone = tone !== "default";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={
        hasTone
          ? {
              backgroundColor: toneSurface,
              borderColor: toneColor,
            }
          : undefined
      }
      className={`min-w-0 flex-row items-center justify-center rounded-[18px] border-0 px-4 active:opacity-70 ${
        compact
          ? large
            ? "min-h-[76px] gap-3 py-3"
            : "min-h-[58px] gap-3 py-3"
          : "min-h-[90px] flex-col gap-2 py-3"
      } ${hasTone ? "" : primary ? "bg-accent" : "bg-surface"}`}
    >
      <View
        style={hasTone ? { backgroundColor: toneColor } : undefined}
        className={`h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[13px] ${
          hasTone ? "" : primary ? "bg-accent-contrast" : "bg-accent-dark"
        }`}
      >
        <Ionicons
          name={icon}
          size={21}
          color={hasTone ? "#FFFFFF" : primary ? contrastText : accentColor}
        />
      </View>

      <Text
        numberOfLines={1}
        style={hasTone ? { color: toneColor } : undefined}
        className={`min-w-0 flex-shrink text-[13px] font-bold ${
          hasTone
            ? ""
            : primary
              ? "text-accent-contrast-text"
              : "text-foreground"
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
