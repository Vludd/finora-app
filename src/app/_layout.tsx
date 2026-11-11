import "../../global.css";

import { LinearGradient } from "expo-linear-gradient";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors as defaultColors } from "@/constants/theme";
import { initializeI18n } from "@/i18n";
import type { Account } from "@/shared/accounts/accountTypes";
import type { Category } from "@/shared/categories/categoryTypes";
import {
  AccountProvider,
  loadSavedAccounts,
} from "@/shared/context/AccountContext";
import {
  CategoryProvider,
  loadSavedCategories,
} from "@/shared/context/CategoryContext";
import {
  CurrencyProvider,
  loadLegacyCurrencyCode,
  loadSavedPreferredCurrencyCode,
} from "@/shared/context/CurrencyContext";
import {
  loadSavedTransactions,
  TransactionProvider,
} from "@/shared/context/TransactionContext";
import type { CurrencyCode } from "@/shared/lib/currencies";
import {
  loadSavedThemeSettings,
  ThemeProvider,
  useTheme,
  type ThemeSettings,
} from "@/shared/theme/ThemeContext";
import type { Transaction } from "@/shared/transactions/transactionTypes";

type InitialAppState = {
  themeSettings: ThemeSettings;
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  preferredCurrencyCode: CurrencyCode;
};

function AppNavigator() {
  const { colors, resolvedColorScheme } = useTheme();
  const insets = useSafeAreaInsets();

  const isDark = resolvedColorScheme === "dark";

  useEffect(() => {
    if (Platform.OS !== "android") return;

    NavigationBar.setStyle(isDark ? "dark" : "light");
    void SystemUI.setBackgroundColorAsync(colors.background).catch((error) => {
      console.warn("Failed to update Android window background", error);
    });
  }, [isDark, colors.background]);

  const statusBarHeight = Math.max(insets.top, 24);
  const gradientHeight = statusBarHeight + 12;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
        animated
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "fade",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="categories"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="accounts"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
      </Stack>

      {Platform.OS === "android" && (
        <LinearGradient
          pointerEvents="none"
          colors={
            isDark
              ? ["rgba(0,0,0,0.62)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0)"]
              : [
                  "rgba(255,255,255,0.82)",
                  "rgba(255,255,255,0.28)",
                  "rgba(255,255,255,0)",
                ]
          }
          locations={[0, statusBarHeight / gradientHeight, 1]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: gradientHeight,
            zIndex: 1000,
          }}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  const [initialState, setInitialState] = useState<InitialAppState | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    async function prepareApp() {
      try {
        await initializeI18n();
      } catch (error) {
        console.warn("Failed to initialize translations", error);
      }

      const legacyCurrencyCode = await loadLegacyCurrencyCode();
      const preferredCurrencyCode =
        await loadSavedPreferredCurrencyCode(legacyCurrencyCode);
      const [themeSettings, categories, accounts, transactions] =
        await Promise.all([
          loadSavedThemeSettings(),
          loadSavedCategories(),
          loadSavedAccounts(legacyCurrencyCode),
          loadSavedTransactions(),
        ]);

      if (active) {
        setInitialState({
          themeSettings,
          categories,
          accounts,
          transactions,
          preferredCurrencyCode,
        });
      }
    }

    void prepareApp();

    return () => {
      active = false;
    };
  }, []);

  if (!initialState) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: defaultColors.background }}
      >
        <ActivityIndicator color={defaultColors.accent} />
      </View>
    );
  }

  return (
    <CurrencyProvider initialCurrencyCode={initialState.preferredCurrencyCode}>
      <TransactionProvider initialTransactions={initialState.transactions}>
        <AccountProvider initialAccounts={initialState.accounts}>
          <CategoryProvider initialCategories={initialState.categories}>
            <ThemeProvider
              mode={initialState.themeSettings.mode}
              paletteId={initialState.themeSettings.paletteId}
            >
              <AppNavigator />
            </ThemeProvider>
          </CategoryProvider>
        </AccountProvider>
      </TransactionProvider>
    </CurrencyProvider>
  );
}
