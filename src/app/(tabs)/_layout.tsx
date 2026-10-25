import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/shared/theme/ThemeContext";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const tabsScreenOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.subtle,
    tabBarStyle: {
      backgroundColor: "transparent",
      borderTopColor: "transparent",
      elevation: 0,
      // borderTopWidth: 1,
      height: 64,
      paddingTop: 7,
      paddingBottom: 7,
    },
    tabBarLabelStyle: {
      fontSize: 10,
      fontWeight: "600",
    },
    tabBarHideOnKeyboard: true,
  } as const;

  return (
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
        name="transactions"
        options={{
          title: t("tabs.transactions"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
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
          title: t("tabs.more"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
