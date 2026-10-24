import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { resources, type AppLanguage } from "./resources";

const LANGUAGE_STORAGE_KEY = "@finora/language";

const supportedLanguages = Object.keys(resources) as AppLanguage[];

function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return Boolean(value && supportedLanguages.includes(value as AppLanguage));
}

function detectDeviceLanguage(): AppLanguage {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase();

  return isAppLanguage(languageCode) ? languageCode : "en";
}

let initialization: Promise<void> | undefined;

export function initializeI18n(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      let savedLanguage: string | null = null;

      try {
        savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      } catch {}

      const language = isAppLanguage(savedLanguage)
        ? savedLanguage
        : detectDeviceLanguage();

      await i18n.use(initReactI18next).init({
        resources,
        lng: language,
        fallbackLng: "en",
        supportedLngs: supportedLanguages,
        defaultNS: "translation",
        interpolation: {
          escapeValue: false,
        },
      });
    })();
  }

  return initialization;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);

  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {}
}

export { i18n };

