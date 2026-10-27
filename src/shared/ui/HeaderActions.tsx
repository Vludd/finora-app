import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeContext";

type Props = {
  showSettings?: boolean;
};

export default function HeaderActions({ showSettings = true }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View className="flex-row items-center gap-2">
      <View
        accessibilityLabel={t("common.notifications")}
        className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface"
      >
        <Ionicons
          name="notifications-outline"
          size={21}
          color={colors.foreground}
        />
      </View>

      {showSettings && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("settings.title")}
          onPress={() => router.push("/settings")}
          className="h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-surface"
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={colors.foreground}
          />
        </Pressable>
      )}
    </View>
  );
}
