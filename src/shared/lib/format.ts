import { i18n } from "@/i18n";
import type { AppLanguage } from "@/i18n/resources";
import type { CurrencyDefinition } from "@/shared/lib/currencies";

const localeByLanguage: Record<AppLanguage, string> = {
  en: "en-KZ",
  ru: "ru-KZ",
};

function getCurrentLocale(): string {
  const language = i18n.resolvedLanguage ?? i18n.language;

  return language in localeByLanguage
    ? localeByLanguage[language as AppLanguage]
    : localeByLanguage.en;
}

export function formatCurrency(
  amount: number,
  currency: CurrencyDefinition,
  spoiler = false,
): string {
  const parts = new Intl.NumberFormat(getCurrentLocale(), {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.fractionDigits,
  }).formatToParts(amount);

  let amountMasked = false;

  return parts
    .map((part) => {
      if (part.type === "currency") {
        return currency.symbol;
      }

      if (!spoiler) {
        return part.value;
      }

      if (part.type === "integer") {
        if (amountMasked) {
          return "";
        }

        amountMasked = true;
        return "••••••••";
      }

      if (
        part.type === "group" ||
        part.type === "decimal" ||
        part.type === "fraction" ||
        part.type === "minusSign" ||
        part.type === "plusSign"
      ) {
        return "";
      }

      return part.value;
    })
    .join("");
}


/** Formats an editable amount with spaces between thousands groups. */
export function formatAmountInput(value: string): string {
  // Keep the hot path used by TextInput lightweight: avoid multiple regex passes
  // and don't rebuild grouping for short values that cannot contain thousands.
  let integerPart = "";
  let decimalPart = "";
  let hasSeparator = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (char >= "0" && char <= "9") {
      if (hasSeparator) decimalPart += char;
      else integerPart += char;
      continue;
    }

    if ((char === "." || char === ",") && !hasSeparator) {
      hasSeparator = true;
    }
  }

  if (integerPart.length <= 3) {
    return hasSeparator ? `${integerPart},${decimalPart}` : integerPart;
  }

  let groupedInteger = "";
  const firstGroupLength = integerPart.length % 3 || 3;
  groupedInteger = integerPart.slice(0, firstGroupLength);

  for (let i = firstGroupLength; i < integerPart.length; i += 3) {
    groupedInteger += ` ${integerPart.slice(i, i + 3)}`;
  }

  return hasSeparator ? `${groupedInteger},${decimalPart}` : groupedInteger;
}

/** Converts a formatted editable amount into a number-friendly string. */
export function normalizeAmountInput(value: string): string {
  return value.replace(/[\s\u00A0\u202F]/g, "").replace(",", ".");
}

export function formatMonthYear(date: Date): string {
  const locale = getCurrentLocale();

  const result = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);

  return result.charAt(0).toLocaleUpperCase(locale) + result.slice(1);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat(getCurrentLocale(), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}
