import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { changeAppLanguage } from "@/i18n";
import { type AppLanguage } from "@/i18n/resources";
import { useCurrency } from "@/shared/context/CurrencyContext";
import { CURRENCIES } from "@/shared/lib/currencies";
import { THEME_PALETTES } from "@/shared/theme/palettes";
import { useTheme, type ThemeMode } from "@/shared/theme/ThemeContext";
import CurrencyPicker from "@/shared/ui/CurrencyPicker";

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
  const currentLanguage: AppLanguage =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru" : "en";
  const {
    colors,
    mode,
    paletteId,
    resolvedColorScheme,
    setThemeMode,
    setPalette,
  } = useTheme();
  const { currencyCode, setCurrencyCode } = useCurrency();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        <View className="gap-3 rounded-[20px] border border-border bg-surface p-4">
          <View className="gap-1">
            <Text className="text-lg font-semibold text-foreground">
              {t("settings.primaryCurrency")}
            </Text>
            <Text className="text-sm leading-5 text-muted">
              {t("settings.primaryCurrencyDescription")}
            </Text>
          </View>
          <CurrencyPicker
            value={currencyCode}
            onChange={setCurrencyCode}
            options={CURRENCIES}
            title={t("settings.primaryCurrency")}
          />
        </View>

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
      </ScrollView>
    </View>
  );
}
