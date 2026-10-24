import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";

type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  title: string;
  description: string;
  icon: IconName;
};

export default function PlaceholderScreen({ title, description, icon }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="w-full max-w-[560px] flex-1 self-center items-center justify-center p-6">
        <View className="mb-6 h-[76px] w-[76px] items-center justify-center rounded-[25px] border border-[#285039] bg-accent-dark">
          <Ionicons name={icon} size={34} color={colors.accent} />
        </View>

        <Text className="text-[10px] font-extrabold tracking-[1.5px] text-accent">
          FINORA · {t("common.inDev")}
        </Text>
        <Text className="mt-3 text-center text-[28px] font-extrabold text-foreground">
          {title}
        </Text>
        <Text className="mt-3 text-center text-sm leading-[22px] text-muted">
          {description}
        </Text>

        <View className="mt-8 w-full flex-row items-center gap-3 rounded-[18px] border border-border bg-surface p-4">
          <Ionicons name="construct-outline" size={20} color={colors.accent} />
          <Text className="flex-1 text-xs leading-[19px] text-muted">
            {t("common.demoPlaceholder")}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
