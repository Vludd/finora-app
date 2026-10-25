import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useAccounts } from "@/shared/context/AccountContext";
import { useCategories } from "@/shared/context/CategoryContext";
import { useCurrency } from "@/shared/context/CurrencyContext";
import { useTransactions } from "@/shared/context/TransactionContext";
import {
  formatCurrency,
  formatMonthYear,
} from "@/shared/lib/format";
import { calculateAccountBalance } from "@/shared/transactions/transactionTypes";
import type { TransactionType } from "@/shared/transactions/transactionTypes";
import { useTheme } from "@/shared/theme/ThemeContext";
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
  const { currency } = useCurrency();
  const { colors } = useTheme();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const locale = (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru-KZ" : "en-KZ";

  const totalBalance = useMemo(
    () =>
      accounts.reduce(
        (total, account) =>
          total + calculateAccountBalance(account.id, transactions),
        0,
      ),
    [accounts, transactions],
  );

  const monthTotals = useMemo(() => {
    const currentMonth = localDateString().slice(0, 7);
    return transactions.reduce(
      (totals, transaction) => {
        if (!transaction.date.startsWith(currentMonth)) return totals;
        if (transaction.type === "income") totals.income += transaction.amount;
        if (transaction.type === "expense") totals.expense += transaction.amount;
        return totals;
      },
      { income: 0, expense: 0 },
    );
  }, [transactions]);

  const weeklySpending = useMemo<WeeklySpendingItem[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dateKey = localDateString(date);
      const value = transactions.reduce(
        (total, transaction) =>
          transaction.type === "expense" && transaction.date === dateKey
            ? total + transaction.amount
            : total,
        0,
      );
      return {
        day: weekdayKeys[date.getDay()],
        value,
        highlighted: index === 6,
      };
    });
  }, [transactions]);

  const weeklyTotal = weeklySpending.reduce((total, item) => total + item.value, 0);
  const weeklyMax = Math.max(1, ...weeklySpending.map((item) => item.value));

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
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
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-[43px] w-[43px] items-center justify-center rounded-[15px] border border-accent-muted bg-accent-dark">
                <Ionicons
                  name="wallet-outline"
                  size={23}
                  color={colors.accent}
                />
              </View>

              <View>
                <Text className="text-[21px] font-extrabold tracking-[-0.6px] text-foreground">
                  {t("common.appName")}
                </Text>
                <Text className="mt-0.5 text-[9px] font-bold tracking-[1.7px] text-subtle">
                  {t("common.appSlogan")}
                </Text>
              </View>
            </View>

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

          <View className="mb-4">
            <Text className="text-[25px] font-extrabold tracking-[-0.8px] text-foreground">
              {t("home.title")}
            </Text>
            <Text className="mt-[5px] text-[13px] text-muted">
              {formatMonthYear(new Date())}
            </Text>
          </View>

          <View className="relative mb-3 overflow-hidden rounded-[25px] border border-hero-border bg-hero p-6">
            <View className="absolute -top-[85px] right-[-45px] h-[220px] w-[220px] rounded-full bg-hero-decoration opacity-60" />

            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold tracking-[1.5px] text-hero-label">
                {t("home.totalBalance")}
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

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="mt-4 text-[33px] font-extrabold tracking-[-1.3px] text-foreground"
            >
              {formatCurrency(totalBalance, currency, !balanceVisible)}
            </Text>

            <Text className="mt-4 text-xs text-hero-secondary">
              {t("home.accountsCount", { count: accounts.length })}
            </Text>

            <View className="absolute bottom-[-42px] right-[-5px]">
              <View className="h-[105px] w-[105px] rounded-[53px] border border-hero-line opacity-50" />
              <View className="absolute left-[17px] top-[17px] h-[71px] w-[71px] rounded-[36px] border border-hero-line opacity-60" />
            </View>
          </View>

          <View className="flex-row gap-3">
            <SummaryCard
              title={t("home.income")}
              amount={formatCurrency(monthTotals.income, currency)}
              period={t("home.thisMonth")}
              icon="arrow-down-outline"
              color={colors.accent}
              iconBackground={colors.incomeSurface}
            />

            <SummaryCard
              title={t("home.expenses")}
              amount={formatCurrency(monthTotals.expense, currency)}
              period={t("home.thisMonth")}
              icon="arrow-up-outline"
              color={colors.expense}
              iconBackground={colors.expenseSurface}
            />
          </View>

          <View className="mt-8">
            <Text className="mb-3 text-[17px] font-extrabold tracking-[-0.35px] text-foreground">
              {t("home.quickActions")}
            </Text>

            <View className="flex-row gap-2">
              <QuickAction
                icon="remove-outline"
                title={t("home.addExpense")}
                onPress={() => openQuickTransaction("expense")}
                contrastText={colors.accentContrastText}
                accentColor={colors.accent}
                primary
              />

              <QuickAction
                icon="add-outline"
                title={t("home.addIncome")}
                onPress={() => openQuickTransaction("income")}
                contrastText={colors.accentContrastText}
                accentColor={colors.accent}
              />

              <QuickAction
                icon="swap-horizontal-outline"
                title={t("home.transfer")}
                onPress={() => openQuickTransaction("transfer")}
                contrastText={colors.accentContrastText}
                accentColor={colors.accent}
              />
            </View>
          </View>

          <View className="mt-8">
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
                  {formatCurrency(weeklyTotal, currency)}
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
                          height: item.value > 0 ? `${Math.max((item.value / weeklyMax) * 100, 6)}%` : "0%",
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

          <View className="mt-8">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[17px] font-extrabold tracking-[-0.35px] text-foreground">
                {t("home.recentTransactions")}
              </Text>

              <Pressable
                onPress={openTransactions}
                className="flex-row items-center gap-[2px]"
                accessibilityRole="button"
              >
                <Text className="text-xs font-bold text-accent">
                  {t("home.viewAll")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.accent}
                />
              </Pressable>
            </View>

            <View className="rounded-[21px] border border-border bg-surface px-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => {
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
                  const title = isTransfer
                    ? `${account?.name ?? t("transactions.unknownAccount")} → ${toAccount?.name ?? t("transactions.unknownAccount")}`
                    : transaction.note.trim() ||
                      category?.name ||
                      t(`transactions.${transaction.type}`);
                  const dateLabel = getTransactionDateLabel(
                    transaction.date,
                    t("dates.today"),
                    t("dates.yesterday"),
                    locale,
                  );
                  const subtitle = isTransfer
                    ? transaction.note || t("transactions.transfer")
                    : `${category?.name ?? t("transactions.uncategorized")} · ${account?.name ?? t("transactions.unknownAccount")}`;
                  const amountPrefix =
                    transaction.type === "income"
                      ? "+"
                      : transaction.type === "expense"
                        ? "−"
                        : "";
                  const amountLabel = `${amountPrefix}${formatCurrency(transaction.amount, currency)}`;
                  const iconName = isTransfer
                    ? "swap-horizontal-outline"
                    : category?.icon ??
                      (transaction.type === "income"
                        ? "trending-up-outline"
                        : "receipt-outline");
                  const iconColor = isTransfer
                    ? colors.accent
                    : category?.color ??
                      (transaction.type === "income"
                        ? colors.income
                        : colors.expense);

                  return (
                    <View key={transaction.id}>
                      <Pressable
                        onPress={openTransactions}
                        className="min-h-[76px] flex-row items-center gap-3 px-1 py-2 active:opacity-70"
                        accessibilityRole="button"
                        accessibilityLabel={`${title}, ${subtitle}, ${amountLabel}`}
                      >
                        <View
                          className="h-[43px] w-[43px] items-center justify-center rounded-[15px]"
                          style={{ backgroundColor: `${iconColor}20` }}
                        >
                          <Ionicons
                            name={iconName as IconName}
                            size={21}
                            color={iconColor}
                          />
                        </View>

                        <View className="min-w-0 flex-1">
                          <Text numberOfLines={1} className="text-[13px] font-bold text-foreground">
                            {title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            className="mt-[5px] text-[10px] text-subtle"
                          >
                            {subtitle} · {dateLabel}
                          </Text>
                        </View>

                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          className="max-w-[116px] text-right text-xs font-extrabold"
                          style={{
                            color:
                              transaction.type === "income"
                                ? colors.income
                                : transaction.type === "expense"
                                  ? colors.expense
                                  : colors.foreground,
                          }}
                        >
                          {amountLabel}
                        </Text>
                      </Pressable>

                      {index < recentTransactions.length - 1 && (
                        <View className="ml-[55px] h-px bg-border" />
                      )}
                    </View>
                  );
                })
              ) : (
                <View className="items-center px-4 py-7">
                  <View className="h-12 w-12 items-center justify-center rounded-[16px] bg-accent-dark">
                    <Ionicons name="receipt-outline" size={23} color={colors.accent} />
                  </View>
                  <Text className="mt-3 text-sm font-bold text-foreground">
                    {t("transactions.emptyTitle")}
                  </Text>
                  <Text className="mt-1 text-center text-xs leading-5 text-muted">
                    {t("transactions.emptyDescription")}
                  </Text>
                  <Pressable
                    onPress={() => openQuickTransaction("expense")}
                    className="mt-4 rounded-[13px] bg-accent px-4 py-2.5"
                    accessibilityRole="button"
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.accentContrastText }}>
                      {t("transactions.addTransaction")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  title,
  amount,
  period,
  icon,
  color,
  iconBackground,
}: {
  title: string;
  amount: string;
  period: string;
  icon: IconName;
  color: string;
  iconBackground: string;
}) {
  return (
    <View className="min-w-0 flex-1 rounded-[21px] border border-border bg-surface p-4">
      <View className="flex-row items-center gap-2">
        <View
          className="h-[34px] w-[34px] items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBackground }}
        >
          <Ionicons name={icon} size={19} color={color} />
        </View>

        <Text className="text-xs font-semibold text-muted">{title}</Text>
      </View>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className="mt-4 text-[17px] font-extrabold tracking-[-0.4px]"
        style={{ color }}
      >
        {amount}
      </Text>

      <Text className="mt-[5px] text-[11px] text-subtle">{period}</Text>
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
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
  contrastText: string;
  accentColor: string;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`min-h-[90px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[19px] border px-1 py-3 active:opacity-70 ${
        primary ? "border-accent bg-accent" : "border-border bg-surface"
      }`}
    >
      <View
        className={`h-[35px] w-[35px] items-center justify-center rounded-xl ${
          primary ? "bg-accent-contrast" : "bg-accent-dark"
        }`}
      >
        <Ionicons
          name={icon}
          size={21}
          color={primary ? contrastText : accentColor}
        />
      </View>

      <Text
        className={`text-[11px] font-bold ${
          primary ? "text-accent-contrast-text" : "text-foreground"
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
