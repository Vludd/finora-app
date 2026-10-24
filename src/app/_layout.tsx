import "../../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/constants/theme";
import { initializeI18n } from "@/i18n";
import {
  CurrencyProvider,
  loadSavedCurrency,
} from "@/shared/context/CurrencyContext";
import {
  DEFAULT_CURRENCY_CODE,
  type CurrencyCode,
} from "@/shared/lib/currencies";

const rootStackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: colors.background },
  animation: "fade",
} as const;

export default function RootLayout() {
  const [initialCurrencyCode, setInitialCurrencyCode] =
    useState<CurrencyCode | null>(null);

  useEffect(() => {
    let active = true;

    async function prepareApp() {
      try {
        await initializeI18n();
      } catch (error) {
        console.warn("Failed to initialize translations", error);
      }

      const currencyCode = await loadSavedCurrency().catch(
        () => DEFAULT_CURRENCY_CODE,
      );

      if (active) {
        setInitialCurrencyCode(currencyCode);
      }
    }

    void prepareApp();

    return () => {
      active = false;
    };
  }, []);

  if (!initialCurrencyCode) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <CurrencyProvider initialCurrencyCode={initialCurrencyCode}>
      <StatusBar style="light" />
      <Stack screenOptions={rootStackScreenOptions} />
    </CurrencyProvider>
  );
}
