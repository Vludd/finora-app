import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { changeAppLanguage } from "@/i18n";
import { type AppLanguage } from "@/i18n/resources";
import { useCurrency } from "@/shared/context/CurrencyContext";
import { useTheme, type ThemeMode } from "@/shared/theme/ThemeContext";
import { THEME_PALETTES } from "@/shared/theme/palettes";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";

const languages: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
];

const themeModes: {
  value: ThemeMode;
  labelKey:
    | "settings.themeSystem"
    | "settings.themeLight"
    | "settings.themeDark";
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "system",
    labelKey: "settings.themeSystem",
    icon: "phone-portrait-outline",
  },
  { value: "light", labelKey: "settings.themeLight", icon: "sunny-outline" },
  { value: "dark", labelKey: "settings.themeDark", icon: "moon-outline" },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { currency, currencies, setCurrency } = useCurrency();
  const {
    colors,
    mode,
    paletteId,
    resolvedColorScheme,
    setThemeMode,
    setPalette,
  } = useTheme();
  const [currencySearch, setCurrencySearch] = useState("");

  const currentLanguage: AppLanguage =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru" : "en";
  const normalizedQuery = currencySearch
    .trim()
    .toLocaleLowerCase(currentLanguage);
  const filteredCurrencies = currencies.filter((item) => {
    return (
      item.code.toLocaleLowerCase().includes(normalizedQuery) ||
      item.symbol.toLocaleLowerCase().includes(normalizedQuery) ||
      item.name[currentLanguage].toLocaleLowerCase().includes(normalizedQuery)
    );
  });

  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  const popularCurrencyCodes = ["USD", "EUR", "RUB", "KZT", "CNY"];

  const isSearchingCurrency = currencySearch.trim().length > 0;

  const visibleCurrencies =
    showAllCurrencies || isSearchingCurrency
      ? filteredCurrencies
      : popularCurrencyCodes.flatMap((code) =>
          filteredCurrencies.filter((item) => item.code === code),
        );

  return (
    <SafeAreaView className="flex-1 bg-background pt-4" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[28px] font-bold text-foreground">
          {t("settings.title")}
        </Text>

        <View className="gap-3 rounded-[20px] border border-border bg-surface p-4">
          <Text className="text-lg font-semibold text-foreground">
            {t("settings.language")}
          </Text>
          <Text className="text-sm text-muted">
            {t("settings.languageDescription")}
          </Text>

          <View className="mt-2 gap-2">
            {languages.map((language) => {
              const selected = currentLanguage === language.code;

              return (
                <Pressable
                  key={language.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    void changeAppLanguage(language.code);
                  }}
                  className={`min-h-[52px] flex-row items-center justify-between rounded-[14px] border px-3 ${
                    selected ? "border-accent bg-accent-dark" : "border-border"
                  }`}
                >
                  <Text
                    className={`text-[15px] font-medium ${
                      selected ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {language.label}
                  </Text>

                  <Text
                    className={`text-lg font-bold text-accent ${
                      selected ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    ✓
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/accounts")}
          className="flex-row items-center gap-3 rounded-[20px] border border-border bg-surface p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-[15px] bg-accent-dark">
            <Ionicons name="wallet-outline" size={23} color={colors.accent} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-base font-semibold text-foreground">
              {t("accounts.title")}
            </Text>
            <Text className="text-sm leading-5 text-muted">
              {t("accounts.description")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtle} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/categories")}
          className="flex-row items-center gap-3 rounded-[20px] border border-border bg-surface p-4"
        >
          <View className="h-12 w-12 items-center justify-center rounded-[15px] bg-accent-dark">
            <Ionicons
              name="pricetags-outline"
              size={23}
              color={colors.accent}
            />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-base font-semibold text-foreground">
              {t("categories.manage.title")}
            </Text>
            <Text className="text-sm leading-5 text-muted">
              {t("categories.manage.description")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtle} />
        </Pressable>

        <View className="gap-4 rounded-[20px] border border-border bg-surface p-4">
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              {t("settings.appearance")}
            </Text>
            <Text className="text-sm leading-5 text-muted">
              {t("settings.themeModeDescription")}
            </Text>
          </View>

          <View className="gap-3">
            <Text className="text-sm font-semibold text-foreground">
              {t("settings.themeMode")}
            </Text>

            <View className="flex-row gap-2">
              {themeModes.map((themeOption) => {
                const selected = mode === themeOption.value;

                return (
                  <Pressable
                    key={themeOption.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      void setThemeMode(themeOption.value);
                    }}
                    className={`min-h-[78px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] border px-1 py-3 ${
                      selected
                        ? "border-accent bg-accent-dark"
                        : "border-border bg-background"
                    }`}
                  >
                    <Ionicons
                      name={themeOption.icon}
                      size={21}
                      color={selected ? colors.accent : colors.subtle}
                    />
                    <Text
                      className={`text-xs font-semibold ${
                        selected ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {t(themeOption.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-3">
            <View className="gap-1">
              <Text className="text-sm font-semibold text-foreground">
                {t("settings.colorScheme")}
              </Text>
              <Text className="text-xs leading-5 text-muted">
                {t("settings.colorSchemeDescription")}
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-between gap-y-3">
              {THEME_PALETTES.map((palette) => {
                const selected = paletteId === palette.id;
                const preview = palette[resolvedColorScheme];

                return (
                  <Pressable
                    key={palette.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={t(`settings.palettes.${palette.id}`)}
                    onPress={() => {
                      void setPalette(palette.id);
                    }}
                    className={`w-[48.5%] rounded-[16px] border p-3 ${
                      selected
                        ? "border-accent bg-accent-dark"
                        : "border-border bg-background"
                    }`}
                  >
                    <View
                      className="h-[54px] flex-row overflow-hidden rounded-[11px] border"
                      style={{
                        backgroundColor: preview.background,
                        borderColor: preview.border,
                      }}
                    >
                      <View
                        className="flex-1"
                        style={{ backgroundColor: preview.surface }}
                      />
                      <View
                        className="w-[15px]"
                        style={{ backgroundColor: preview.accent }}
                      />
                      <View
                        className="w-[15px]"
                        style={{ backgroundColor: preview.accentDark }}
                      />
                    </View>

                    <View className="mt-3 min-h-5 flex-row items-center justify-between gap-1">
                      <Text
                        numberOfLines={1}
                        className={`flex-1 text-xs font-semibold ${
                          selected ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {t(`settings.palettes.${palette.id}`)}
                      </Text>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={17}
                          color={colors.accent}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View className="gap-3 rounded-[20px] border border-border bg-surface p-4">
          <Text className="text-lg font-semibold text-foreground">
            {t("settings.currency")}
          </Text>
          <Text className="text-sm text-muted">
            {t("settings.currencyDescription")}
          </Text>

          <TextInput
            value={currencySearch}
            onChangeText={setCurrencySearch}
            placeholder={t("settings.currencySearch")}
            placeholderTextColor={colors.subtle}
            className="mt-2 min-h-12 rounded-[13px] border border-border bg-background px-3 text-sm text-foreground"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("common.search")}
          />

          <View className="mt-2 gap-1">
            {visibleCurrencies.map((item) => {
              const selected = currency.code === item.code;

              return (
                <Pressable
                  key={item.code}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name[currentLanguage]}, ${item.code}, ${item.symbol}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    void setCurrency(item.code);
                  }}
                  className={`min-h-16 flex-row items-center gap-3 rounded-[14px] border px-2 py-2 ${
                    selected ? "border-accent bg-accent-dark" : "border-border"
                  }`}
                >
                  <View className="h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-surface-raised">
                    <Text className="text-base font-bold text-foreground">
                      {item.symbol}
                    </Text>
                  </View>

                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-[13px] font-semibold text-foreground">
                      {item.name[currentLanguage]}
                    </Text>
                    <Text className="text-[11px] font-semibold tracking-[0.7px] text-subtle">
                      {item.code}
                    </Text>
                  </View>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={colors.accent}
                    />
                  )}
                </Pressable>
              );
            })}

            {filteredCurrencies.length === 0 && (
              <Text className="text-sm text-muted">
                {t("settings.noCurrenciesFound")}
              </Text>
            )}

            {!isSearchingCurrency && filteredCurrencies.length > 5 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowAllCurrencies((prev) => !prev)}
                className="mt-2 min-h-12 flex-row items-center justify-center gap-2 rounded-[14px] border border-border px-3"
              >
                <Text className="text-sm font-semibold text-accent">
                  {showAllCurrencies
                    ? "Скрыть дополнительные валюты"
                    : "Показать все валюты"}
                </Text>

                <Ionicons
                  name={showAllCurrencies ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.accent}
                />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
