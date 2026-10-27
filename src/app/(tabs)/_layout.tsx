import { Ionicons } from "@expo/vector-icons";
import { Tabs, useSegments } from "expo-router";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/shared/theme/ThemeContext";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppHeader from "@/shared/ui/AppHeader";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const activeRoute = segments[segments.length - 1] ?? "index";
  const titles: Record<string, string> = {
    index: t("home.title"),
    transactions: t("transactions.title"),
    budgets: t("budgets.title"),
    goals: t("goals.title"),
    accounts: t("accounts.title"),
    settings: t("settings.title"),
  };
  const headerTitle = titles[activeRoute] ?? t("home.title");

  const tabsScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.subtle,
    tabBarStyle: {
      backgroundColor: "transparent",
      borderTopColor: "transparent",
      elevation: 0,
      // borderTopWidth: 1,
      height: 64 + insets.bottom,
      paddingTop: 7,
      paddingBottom: 7 + insets.bottom,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: "600",
    },
    tabBarHideOnKeyboard: true,
  } as const;

  return (
    <View className="flex-1 bg-background">
      <AppHeader title={headerTitle} />
      <Tabs screenOptions={tabsScreenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="accounts"
          options={{
            title: t("tabs.accounts"),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="transactions"
          options={{
            title: t("tabs.transactions"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="swap-horizontal-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="budgets"
          options={{
            title: t("tabs.budgets"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="goals"
          options={{
            title: t("tabs.goals"),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flag-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}
