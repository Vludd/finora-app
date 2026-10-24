import PlaceholderScreen from "@/shared/ui/PlaceholderScreen";
import { useTranslation } from "react-i18next";

export default function TransactionsScreen() {
  const { t } = useTranslation();

  return (
    <PlaceholderScreen
      title={t("transactions.title")}
      description={t("transactions.description")}
      icon="receipt-outline"
    />
  );
}
