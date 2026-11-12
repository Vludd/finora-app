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
  const cleaned = value.replace(/[^0-9.,]/g, "");
  const separatorIndex = cleaned.search(/[.,]/);
  const hasSeparator = separatorIndex >= 0;
  const integerPart = (hasSeparator ? cleaned.slice(0, separatorIndex) : cleaned)
    .replace(/[.,]/g, "");
  const decimalPart = hasSeparator
    ? cleaned.slice(separatorIndex + 1).replace(/[.,]/g, "")
    : "";
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return hasSeparator
    ? `${groupedInteger},${decimalPart}`
    : groupedInteger;
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
