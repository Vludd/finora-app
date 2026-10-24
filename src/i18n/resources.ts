import en from "./locales/en";
import ru from "./locales/ru";

export const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

export type AppLanguage = keyof typeof resources;
