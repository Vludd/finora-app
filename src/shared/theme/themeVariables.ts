import type { ThemeColors } from "@/shared/theme/palettes";

/**
 * NativeWind theme variables need to be attached to modal roots as well as the
 * app root. On web, Modal renders through a portal outside the app root's CSS
 * variable scope, so without these variables themed classes become transparent
 * and text falls back to the browser default color.
 */
export function getThemeCssVariables(colors: ThemeColors) {
  return {
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
  };
}
