import { Ionicons } from "@expo/vector-icons";
import { createElement, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeContext";

type DatePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
};

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function DatePickerField({
  value,
  onChange,
  label,
}: DatePickerFieldProps) {
  const { t, i18n } = useTranslation();
  const { colors, resolvedColorScheme } = useTheme();
  const locale =
    (i18n.resolvedLanguage ?? i18n.language) === "ru" ? "ru-KZ" : "en-KZ";
  const selectedDate = parseDate(value);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = selectedDate ?? new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    );
  }, [value]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(visibleMonth),
    [locale, visibleMonth],
  );

  const calendarWeeks = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<number | null> = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    while (cells.length % 7 !== 0) cells.push(null);

    return Array.from({ length: cells.length / 7 }, (_, index) =>
      cells.slice(index * 7, index * 7 + 7),
    );
  }, [visibleMonth]);

  if (Platform.OS === "web") {
    // Use the browser's native date control. It opens a proper picker in both
    // Chromium and Firefox, while keeping the stored value as YYYY-MM-DD.
    return createElement("input", {
      type: "date",
      value,
      "aria-label": label,
      onChange: (event: { currentTarget: { value: string } }) => {
        if (event.currentTarget.value) onChange(event.currentTarget.value);
      },
      style: {
        appearance: "auto",
        boxSizing: "border-box",
        display: "block",
        width: "100%",
        minWidth: 0,
        height: 46,
        padding: "0 14px",
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        backgroundColor: colors.surface,
        color: colors.foreground,
        fontFamily: "inherit",
        fontSize: 14,
        colorScheme: resolvedColorScheme,
        outlineOffset: 2,
      },
    } as never);
  }

  const weekdayKeys = [
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
    "sun",
  ] as const;
  const formattedValue = selectedDate
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(selectedDate)
    : value;
  const today = toDateString(new Date());

  const changeMonth = (offset: number) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  };

  return (
    <View className="gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: calendarVisible }}
        onPress={() => setCalendarVisible((visible) => !visible)}
        className="min-h-12 flex-row items-center gap-3 rounded-[14px] border border-border bg-surface px-4 py-3"
      >
        <Ionicons name="calendar-outline" size={19} color={colors.subtle} />
        <Text className="min-w-0 flex-1 text-sm text-foreground">
          {formattedValue}
        </Text>
        <Ionicons
          name={calendarVisible ? "chevron-up" : "chevron-down"}
          size={17}
          color={colors.subtle}
        />
      </Pressable>

      {calendarVisible ? (
        <View className="gap-3 rounded-[16px] border border-border bg-surface p-3">
          <View className="flex-row items-center justify-between gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("dates.previousMonth")}
              onPress={() => changeMonth(-1)}
              className="h-9 w-9 items-center justify-center rounded-[11px] border border-border bg-surface-raised"
            >
              <Ionicons name="chevron-back" size={18} color={colors.foreground} />
            </Pressable>
            <Text className="flex-1 text-center text-sm font-bold capitalize text-foreground">
              {monthTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("dates.nextMonth")}
              onPress={() => changeMonth(1)}
              className="h-9 w-9 items-center justify-center rounded-[11px] border border-border bg-surface-raised"
            >
              <Ionicons name="chevron-forward" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          <View className="flex-row">
            {weekdayKeys.map((key) => (
              <View key={key} className="h-8 flex-1 items-center justify-center">
                <Text className="text-[11px] font-semibold text-subtle">
                  {t(`weekdays.${key}`)}
                </Text>
              </View>
            ))}
          </View>

          <View className="gap-1">
            {calendarWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} className="flex-row gap-1">
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return (
                      <View
                        key={`empty-${weekIndex}-${dayIndex}`}
                        className="h-10 flex-1"
                      />
                    );
                  }

                  const date = new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth(),
                    day,
                  );
                  const dateString = toDateString(date);
                  const selected = value === dateString;
                  const isToday = today === dateString;

                  return (
                    <Pressable
                      key={dateString}
                      accessibilityRole="button"
                      accessibilityLabel={new Intl.DateTimeFormat(locale, {
                        dateStyle: "full",
                      }).format(date)}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        onChange(dateString);
                        setCalendarVisible(false);
                      }}
                      className="h-10 flex-1 items-center justify-center rounded-[11px]"
                      style={{
                        backgroundColor: selected
                          ? colors.accentDark
                          : "transparent",
                        borderWidth: isToday && !selected ? 1 : 0,
                        borderColor: colors.accent,
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{
                          color: selected ? colors.accent : colors.foreground,
                        }}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onChange(today);
              setVisibleMonth(new Date());
              setCalendarVisible(false);
            }}
            className="self-start rounded-[11px] px-3 py-2"
          >
            <Text className="text-sm font-bold" style={{ color: colors.accent }}>
              {t("dates.today")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
