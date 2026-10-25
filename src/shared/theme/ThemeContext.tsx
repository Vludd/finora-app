import AsyncStorage from "@react-native-async-storage/async-storage";
import { vars, useColorScheme } from "nativewind";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { View } from "react-native";

import {
  DEFAULT_THEME_PALETTE_ID,
  getThemePalette,
  isThemePaletteId,
  type ThemeColorScheme,
  type ThemeColors,
  type ThemePaletteId,
} from "@/shared/theme/palettes";

export type ThemeMode = "system" | "light" | "dark";

export type ThemeSettings = {
  mode: ThemeMode;
  paletteId: ThemePaletteId;
};

type ThemeContextValue = ThemeSettings & {
  resolvedColorScheme: ThemeColorScheme;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setPalette: (paletteId: ThemePaletteId) => Promise<void>;
};

const THEME_MODE_STORAGE_KEY = "@finora/theme-mode";
const THEME_PALETTE_STORAGE_KEY = "@finora/theme-palette";

const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: "system",
  paletteId: DEFAULT_THEME_PALETTE_ID,
};

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export async function loadSavedThemeSettings(): Promise<ThemeSettings> {
  const [savedMode, savedPalette] = await Promise.all([
    AsyncStorage.getItem(THEME_MODE_STORAGE_KEY).catch(() => null),
    AsyncStorage.getItem(THEME_PALETTE_STORAGE_KEY).catch(() => null),
  ]);

  return {
    mode: isThemeMode(savedMode) ? savedMode : DEFAULT_THEME_SETTINGS.mode,
    paletteId: isThemePaletteId(savedPalette)
      ? savedPalette
      : DEFAULT_THEME_SETTINGS.paletteId,
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = PropsWithChildren<ThemeSettings>;

export function ThemeProvider({
  mode: initialMode,
  paletteId: initialPaletteId,
  children,
}: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [paletteId, setPaletteId] = useState<ThemePaletteId>(initialPaletteId);

  const resolvedColorScheme: ThemeColorScheme =
    mode === "system" ? (colorScheme === "dark" ? "dark" : "light") : mode;

  const colors: ThemeColors = getThemePalette(paletteId)[resolvedColorScheme];

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  const updateThemeMode = useCallback(
    async (nextMode: ThemeMode) => {
      setMode(nextMode);
      setColorScheme(nextMode);

      try {
        await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
      } catch (error) {
        console.warn("Failed to save the theme mode", error);
      }
    },
    [setColorScheme],
  );

  const updatePalette = useCallback(async (nextPaletteId: ThemePaletteId) => {
    setPaletteId(nextPaletteId);

    try {
      await AsyncStorage.setItem(THEME_PALETTE_STORAGE_KEY, nextPaletteId);
    } catch (error) {
      console.warn("Failed to save the selected color palette", error);
    }
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      mode,
      paletteId,
      resolvedColorScheme,
      colors,
      setThemeMode: updateThemeMode,
      setPalette: updatePalette,
    }),
    [mode, paletteId, resolvedColorScheme, colors, updateThemeMode, updatePalette],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <View
        className="flex-1 bg-background"
        style={vars({
          "--color-background": colors.background,
          "--color-surface": colors.surface,
          "--color-surface-raised": colors.surfaceRaised,
          "--color-surface-soft": colors.surfaceSoft,
          "--color-border": colors.border,
          "--color-accent": colors.accent,
          "--color-accent-dark": colors.accentDark,
          "--color-accent-muted": colors.accentMuted,
          "--color-foreground": colors.foreground,
          "--color-muted": colors.muted,
          "--color-subtle": colors.subtle,
          "--color-income": colors.income,
          "--color-expense": colors.expense,
          "--color-warning": colors.warning,
          "--color-accent-contrast": colors.accentContrast,
          "--color-accent-contrast-text": colors.accentContrastText,
          "--color-hero": colors.heroBackground,
          "--color-hero-decoration": colors.heroDecoration,
          "--color-hero-border": colors.heroBorder,
          "--color-hero-label": colors.heroLabel,
          "--color-hero-secondary": colors.heroSecondary,
          "--color-positive-surface": colors.positiveSurface,
          "--color-hero-line": colors.heroLine,
          "--color-chart-bar": colors.chartBar,
          "--color-transaction-food": colors.transactionFood,
          "--color-transaction-food-surface": colors.transactionFoodSurface,
          "--color-transaction-transport": colors.transactionTransport,
          "--color-transaction-transport-surface": colors.transactionTransportSurface,
          "--color-transaction-cafe": colors.transactionCafe,
          "--color-transaction-cafe-surface": colors.transactionCafeSurface,
          "--color-income-surface": colors.incomeSurface,
          "--color-expense-surface": colors.expenseSurface,
        })}
      >
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
