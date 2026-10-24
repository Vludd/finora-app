import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useCurrency } from "@/shared/context/CurrencyContext";
import {
  formatCurrency,
  formatMonthYear,
  formatPercent,
} from "@/shared/lib/format";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";

type IconName = keyof typeof Ionicons.glyphMap;
type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type DateKey = "today" | "yesterday";
type TransactionCategoryKey =
  | "categories.expense.food"
  | "categories.expense.cafe"
  | "categories.expense.transport"
  | "transactions.work";
type TransactionTitleKey = "categories.income.salary";

type TransactionItem = {
  id: string;
  title?: string;
  titleKey?: TransactionTitleKey;
  categoryKey: TransactionCategoryKey;
  dateKey: DateKey;
  time?: string;
  amount: number;
  type: "income" | "expense";
  icon: IconName;
  iconColor: string;
  iconBackground: string;
};

const weeklySpending: {
  day: WeekdayKey;
  value: number;
  highlighted?: boolean;
}[] = [
  { day: "mon", value: 0.42 },
  { day: "tue", value: 0.68 },
  { day: "wed", value: 0.48 },
  { day: "thu", value: 0.86 },
  { day: "fri", value: 0.63, highlighted: true },
  { day: "sat", value: 0.34 },
  { day: "sun", value: 0.22 },
];

const transactions: TransactionItem[] = [
  {
    id: "1",
    title: "Magnum",
    categoryKey: "categories.expense.food",
    dateKey: "today",
    time: "14:32",
    amount: 12_450,
    type: "expense",
    icon: "cart-outline",
    iconColor: "#F3C66B",
    iconBackground: "#332B1B",
  },
  {
    id: "2",
    titleKey: "categories.income.salary",
    categoryKey: "transactions.work",
    dateKey: "today",
    time: "09:10",
    amount: 450_000,
    type: "income",
    icon: "wallet-outline",
    iconColor: colors.accent,
    iconBackground: "#173A2A",
  },
  {
    id: "3",
    title: "Yandex Go",
    categoryKey: "categories.expense.transport",
    dateKey: "yesterday",
    amount: 2_350,
    type: "expense",
    icon: "car-outline",
    iconColor: "#A9B8FF",
    iconBackground: "#222943",
  },
  {
    id: "4",
    title: "Coffee Boom",
    categoryKey: "categories.expense.cafe",
    dateKey: "yesterday",
    amount: 1_800,
    type: "expense",
    icon: "cafe-outline",
    iconColor: "#D9A67B",
    iconBackground: "#34271F",
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const router = useRouter();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const openTransactions = () => {
    router.push("/(tabs)/transactions");
  };

  const openGoals = () => {
    router.push("/(tabs)/goals");
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[560px] self-center px-4 pt-2">
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-[43px] w-[43px] items-center justify-center rounded-[15px] border border-[#286444] bg-accent-dark">
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

            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-[5px] rounded-[10px] border border-border bg-surface px-[9px] py-[7px]">
                <View className="h-[6px] w-[6px] rounded-full bg-warning" />
                <Text className="text-[9px] font-extrabold tracking-[0.7px] text-muted">
                  {t("common.demo")}
                </Text>
              </View>

              <View
                className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface"
                accessibilityLabel={t("common.notifications")}
              >
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color={colors.text}
                />
              </View>
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

          <View className="relative mb-3 overflow-hidden rounded-[25px] border border-[#285039] bg-[#102219] p-6">
            <View className="absolute -top-[85px] right-[-45px] h-[220px] w-[220px] rounded-full bg-[#17442E] opacity-60" />

            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-bold tracking-[1.5px] text-[#B2C7B8]">
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
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="mt-4 text-[33px] font-extrabold tracking-[-1.3px] text-foreground"
            >
              {formatCurrency(1_245_680, currency, !balanceVisible)}
            </Text>

            <View className="mt-4 flex-row items-center gap-2">
              <View className="flex-row items-center gap-1 rounded-[9px] bg-[#173B29] px-2 py-[5px]">
                <Ionicons
                  name="trending-up-outline"
                  size={15}
                  color={colors.accent}
                />
                <Text className="text-xs font-extrabold text-accent">
                  +{formatPercent(0.084)}
                </Text>
              </View>

              <Text className="text-xs text-[#A2B4A7]">
                {t("home.previousMonth")}
              </Text>
            </View>

            <View className="absolute bottom-[-42px] right-[-5px]">
              <View className="h-[105px] w-[105px] rounded-[53px] border border-[#356347] opacity-50" />
              <View className="absolute left-[17px] top-[17px] h-[71px] w-[71px] rounded-[36px] border border-[#356347] opacity-60" />
            </View>
          </View>

          <View className="flex-row gap-3">
            <SummaryCard
              title={t("home.income")}
              amount={formatCurrency(485_000, currency)}
              period={t("home.thisMonth")}
              icon="arrow-down-outline"
              color={colors.accent}
              iconBackground="#173A2A"
            />

            <SummaryCard
              title={t("home.expenses")}
              amount={formatCurrency(218_450, currency)}
              period={t("home.thisMonth")}
              icon="arrow-up-outline"
              color={colors.expense}
              iconBackground="#3B2024"
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
                onPress={openTransactions}
                primary
              />

              <QuickAction
                icon="add-outline"
                title={t("home.addIncome")}
                onPress={openTransactions}
              />

              <QuickAction
                icon="swap-horizontal-outline"
                title={t("home.transfer")}
                onPress={openTransactions}
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
                  {formatCurrency(56_320, currency)}
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
                          height: `${item.value * 100}%`,
                          backgroundColor: item.highlighted
                            ? colors.accent
                            : "#315440",
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
                {t("home.savingsGoal")}
              </Text>

              <Pressable
                onPress={openGoals}
                className="flex-row items-center gap-[2px]"
                accessibilityRole="button"
              >
                <Text className="text-xs font-bold text-accent">
                  {t("home.allGoals")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.accent}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={openGoals}
              className="rounded-[22px] border border-border bg-surface p-4 active:opacity-70"
              accessibilityRole="button"
            >
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl border border-[#285039] bg-accent-dark">
                  <Ionicons
                    name="laptop-outline"
                    size={24}
                    color={colors.accent}
                  />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-extrabold text-foreground">
                    {t("home.newLaptop")}
                  </Text>
                  <Text className="mt-[5px] text-[11px] text-subtle">
                    {t("home.goalDescription")}
                  </Text>
                </View>

                <Text className="text-[19px] font-extrabold text-accent">
                  35%
                </Text>
              </View>

              <View className="mt-6 h-[7px] overflow-hidden rounded-[5px] bg-surface-raised">
                <View className="h-full w-[35%] rounded-[5px] bg-accent" />
              </View>

              <View className="mt-3 gap-[7px]">
                <Text className="text-xs font-bold text-foreground">
                  {formatCurrency(420_000, currency)}{" "}
                  <Text className="font-medium text-subtle">
                    {t("home.ofAmount", {
                      amount: formatCurrency(1_200_000, currency),
                    })}
                  </Text>
                </Text>
                <Text className="text-[11px] text-muted">
                  {t("home.remainingToSave", {
                    amount: formatCurrency(780_000, currency),
                  })}
                </Text>
              </View>
            </Pressable>
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
              {transactions.map((transaction, index) => {
                const title = transaction.titleKey
                  ? t(transaction.titleKey)
                  : (transaction.title ?? "");
                const dateLabel =
                  transaction.dateKey === "today"
                    ? t("dates.today")
                    : t("dates.yesterday");
                const categoryLabel = t(transaction.categoryKey);
                const transactionSubtitle = transaction.time
                  ? `${categoryLabel} · ${dateLabel}, ${transaction.time}`
                  : `${categoryLabel} · ${dateLabel}`;
                const amountLabel = `${
                  transaction.type === "income" ? "+" : "−"
                }${formatCurrency(transaction.amount, currency)}`;

                return (
                  <View key={transaction.id}>
                    <Pressable
                      onPress={openTransactions}
                      className="min-h-[76px] flex-row items-center gap-3 px-1 py-2 active:opacity-70"
                      accessibilityRole="button"
                      accessibilityLabel={`${title}, ${transactionSubtitle}, ${amountLabel}`}
                    >
                      <View
                        className="h-[43px] w-[43px] items-center justify-center rounded-[15px]"
                        style={{ backgroundColor: transaction.iconBackground }}
                      >
                        <Ionicons
                          name={transaction.icon}
                          size={21}
                          color={transaction.iconColor}
                        />
                      </View>

                      <View className="min-w-0 flex-1">
                        <Text className="text-[13px] font-bold text-foreground">
                          {title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="mt-[5px] text-[10px] text-subtle"
                        >
                          {transactionSubtitle}
                        </Text>
                      </View>

                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        className="max-w-[116px] text-right text-xs font-extrabold"
                        style={{
                          color:
                            transaction.type === "income"
                              ? colors.accent
                              : colors.text,
                        }}
                      >
                        {amountLabel}
                      </Text>
                    </Pressable>

                    {index < transactions.length - 1 && (
                      <View className="ml-[55px] h-px bg-border" />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <Text className="mt-8 text-center text-[10px] text-subtle">
            {t("home.demoFooter")}
          </Text>
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
  primary = false,
}: {
  icon: IconName;
  title: string;
  onPress: () => void;
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
          primary ? "bg-[#B4F5D9]" : "bg-accent-dark"
        }`}
      >
        <Ionicons
          name={icon}
          size={21}
          color={primary ? colors.background : colors.accent}
        />
      </View>

      <Text
        className={`text-[11px] font-bold ${
          primary ? "text-[#06140C]" : "text-foreground"
        }`}
      >
        {title}
      </Text>
    </Pressable>
  );
}
