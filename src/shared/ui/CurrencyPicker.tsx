import { Ionicons } from "@expo/vector-icons";
import { vars } from "nativewind";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CURRENCIES,
  getCurrencyByCode,
  type CurrencyCode,
  type CurrencyDefinition,
} from "@/shared/lib/currencies";
import { useTheme } from "@/shared/theme/ThemeContext";
import { getThemeCssVariables } from "@/shared/theme/themeVariables";

type Props = {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  options?: readonly CurrencyDefinition[];
  compact?: boolean;
  title?: string;
};

export default function CurrencyPicker({
  value,
  onChange,
  options = CURRENCIES,
  compact = false,
  title,
}: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
  const language =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru" : "en";
  const selectedCurrency = getCurrencyByCode(value);

  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(language);
    if (!query) return options;

    return options.filter((currency) =>
      [currency.code, currency.symbol, currency.name[language]].some((value) =>
        value.toLocaleLowerCase(language).includes(query),
      ),
    );
  }, [language, options, search]);

  const close = () => {
    setVisible(false);
    setSearch("");
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title ?? t("settings.primaryCurrency")}
        accessibilityHint={t("settings.primaryCurrencyDescription")}
        onPress={() => setVisible(true)}
        className={`flex-row items-center justify-center gap-1.5 rounded-full border border-border bg-surface ${
          compact ? "min-h-9 px-3" : "min-h-12 px-4"
        }`}
      >
        <Text
          className={`font-bold text-foreground ${compact ? "text-xs" : "text-sm"}`}
        >
          {selectedCurrency.symbol} {selectedCurrency.code}
        </Text>
        <Ionicons
          name="chevron-down"
          size={compact ? 14 : 17}
          color={colors.subtle}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View
          className="flex-1 justify-end bg-black/50"
          style={vars(getThemeCssVariables(colors))}
        >
          <View
            className="max-h-[82%] rounded-t-[26px] border border-border bg-background px-4 pt-5"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="mb-4 flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="text-lg font-extrabold text-foreground">
                  {title ?? t("settings.primaryCurrency")}
                </Text>
                <Text className="text-sm text-muted">
                  {t("settings.primaryCurrencyDescription")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
                onPress={close}
                className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface"
              >
                <Ionicons name="close" size={21} color={colors.foreground} />
              </Pressable>
            </View>

            <View className="mb-3 h-12 flex-row items-center gap-2 rounded-[14px] border border-border bg-surface px-3">
              <Ionicons name="search-outline" size={19} color={colors.subtle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("accounts.manage.currencySearch")}
                placeholderTextColor={colors.subtle}
                className="min-w-0 flex-1 py-0 text-sm text-foreground"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons
                    name="close-circle"
                    size={19}
                    color={colors.subtle}
                  />
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="gap-2 pb-4"
            >
              {filteredCurrencies.map((currency) => {
                const selected = currency.code === value;
                return (
                  <Pressable
                    key={currency.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      onChange(currency.code);
                      close();
                    }}
                    className={`min-h-[58px] flex-row items-center gap-3 rounded-[15px] border px-3 ${
                      selected
                        ? "border-accent bg-accent-dark"
                        : "border-border bg-surface"
                    }`}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-background">
                      <Text className="text-base font-extrabold text-foreground">
                        {currency.symbol}
                      </Text>
                    </View>
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text className="text-sm font-bold text-foreground">
                        {currency.code}
                      </Text>
                      <Text numberOfLines={1} className="text-xs text-muted">
                        {currency.name[language]}
                      </Text>
                    </View>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color={colors.accent}
                      />
                    ) : null}
                  </Pressable>
                );
              })}

              {filteredCurrencies.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-sm text-muted">
                    {t("accounts.manage.noCurrenciesFound")}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
