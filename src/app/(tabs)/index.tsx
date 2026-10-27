import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAccounts } from "@/shared/context/AccountContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import { useCurrency } from "@/shared/context/CurrencyContext";
import {
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
  getCurrencyByCode,
} from "@/shared/lib/currencies";
import { formatCurrency } from "@/shared/lib/format";
import CurrencyPicker from "@/shared/ui/CurrencyPicker";
import { useTheme } from "@/shared/theme/ThemeContext";
import type { TransactionType } from "@/shared/transactions/transactionTypes";
import { calculateAccountBalance } from "@/shared/transactions/transactionTypes";

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

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { currencyCode, setCurrencyCode } = useCurrency();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const currencyOptions = useMemo(() => {
    const codes = new Set(
      accounts.map((account) => account.currencyCode ?? DEFAULT_CURRENCY_CODE),
    );
    codes.add(currencyCode);
    return CURRENCIES.filter((currency) => codes.has(currency.code));
  }, [accounts, currencyCode]);

  const balance = useMemo(
    () =>
      accounts.reduce((total, account) => {
        if ((account.currencyCode ?? DEFAULT_CURRENCY_CODE) !== currencyCode) {
          return total;
        }
        return total + calculateAccountBalance(account.id, transactions);
      }, 0),
    [accounts, transactions, currencyCode],
  );

  const monthTotals = useMemo(() => {
    const currentMonth = localDateString().slice(0, 7);
    const totals = { income: 0, expense: 0 };

    for (const transaction of transactions) {
      if (
        !transaction.date.startsWith(currentMonth) ||
        transaction.type === "transfer"
      ) {
        continue;
      }

      const account = accounts.find((item) => item.id === transaction.accountId);
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
  const displayedMonthIncomeAmounts = [
    formatCurrency(monthTotals.income, selectedCurrency, !balanceVisible),
  ];
  const displayedMonthExpenseAmounts = [
    formatCurrency(monthTotals.expense, selectedCurrency, !balanceVisible),
  ];

  const weeklySpending = useMemo<WeeklySpendingItem[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateKey = localDateString(date);
      const value = transactions.reduce((total, transaction) => {
        if (transaction.type !== "expense" || transaction.date !== dateKey) {
          return total;
        }
        const account = accounts.find((item) => item.id === transaction.accountId);
        return (account?.currencyCode ?? DEFAULT_CURRENCY_CODE) === currencyCode
          ? total + transaction.amount
          : total;
      }, 0);
      return {
        day: weekdayKeys[date.getDay()],
        value,
        highlighted: index === 6,
      };
    });
  }, [transactions, accounts, currencyCode]);

  const weeklyTotal = weeklySpending.reduce(
    (total, item) => total + item.value,
    0,
  );
  const weeklyMax = Math.max(1, ...weeklySpending.map((item) => item.value));

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
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[560px] self-center px-4">
          <View className="relative overflow-hidden rounded-[25px] border border-hero-border bg-hero p-6">
            <View className="absolute -top-[85px] right-[-45px] h-[220px] w-[220px] rounded-full bg-hero-decoration opacity-60" />

            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold tracking-[1.5px] text-hero-label">
                {t("home.totalBalance")}
              </Text>

              <View className="flex-row items-center gap-2">
                <CurrencyPicker
                  value={currencyCode}
                  onChange={setCurrencyCode}
                  options={currencyOptions}
                  compact
                />
                <Pressable
                  onPress={() => setBalanceVisible((value) => !value)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={
                    balanceVisible
                      ? t("common.hideBalance")
                      : t("common.showBalance")
                  }
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Ionicons
                    name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                    size={21}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            <View className="mt-3 gap-1">
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-[30px] font-extrabold tracking-[-1px] text-foreground"
              >
                {formatCurrency(balance, selectedCurrency, !balanceVisible)}
              </Text>
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
            <View className="mb-3 flex-row items-center justify-between gap-3">
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
                    selectedCurrency,
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
    </View>
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
