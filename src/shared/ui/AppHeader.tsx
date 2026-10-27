import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeContext";
import { SafeAreaView } from "@/shared/ui/SafeAreaView";
import HeaderActions from "@/shared/ui/HeaderActions";

type Props = {
  title: string;
  showBackButton?: boolean;
};

export default function AppHeader({ title, showBackButton = false }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView className="bg-background" edges={["top"]}>
      <View className="h-[64px] border-b border-border">
        <View className="h-full w-full max-w-[560px] flex-row items-center gap-3 self-center px-4">
          {showBackButton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface"
            >
              <Ionicons name="arrow-back" size={20} color={colors.foreground} />
            </Pressable>
          ) : null}

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="min-w-0 flex-1 text-[23px] font-extrabold tracking-[-0.7px] text-foreground"
          >
            {title}
          </Text>

          <HeaderActions />
        </View>
      </View>
    </SafeAreaView>
  );
}
