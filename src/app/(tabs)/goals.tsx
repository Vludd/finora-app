import PlaceholderScreen from "@/shared/ui/PlaceholderScreen";
import { useTranslation } from "react-i18next";

export default function GoalsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t("goals.title")}
      description={t("goals.description")}
      icon="flag-outline"
    />
  );
}
