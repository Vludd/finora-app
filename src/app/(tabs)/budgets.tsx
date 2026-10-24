import PlaceholderScreen from "@/shared/ui/PlaceholderScreen";
import { useTranslation } from "react-i18next";

export default function BudgetsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t("budgets.title")}
      description={t("budgets.description")}
      icon="pie-chart-outline"
    />
  );
}
