import { useMemo, useRef } from "react";
import { Animated } from "react-native";
import { Gesture } from "react-native-gesture-handler";

type Options = {
  enabled: boolean;
  translateY: Animated.Value;
  scrollOffsetY: { current: number };
  isDismissing: { current: boolean };
  onDismiss: () => void;
};

/**
 * Native bottom-sheet gesture. The pan recognizer runs alongside the native
 * ScrollView recognizer: scrolling remains native, while a downward drag at
 * the top of the content moves the whole sheet. The gesture is attached to
 * the sheet surface, not just its grabber.
 */
export function useBottomSheetDismissGesture({
  enabled,
  translateY,
  scrollOffsetY,
  isDismissing,
  onDismiss,
}: Options) {
  const draggingSheet = useRef(false);
  const sheetStartTranslationY = useRef(0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const scrollGesture = useMemo(
    () => Gesture.Native().enabled(enabled),
    [enabled],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .activeOffsetY(8)
        .failOffsetX([-18, 18])
        .simultaneousWithExternalGesture(scrollGesture)
        .runOnJS(true)
        .onStart(() => {
          draggingSheet.current = false;
          sheetStartTranslationY.current = 0;
        })
        .onUpdate((event) => {
          if (
            !isDismissing.current &&
            scrollOffsetY.current <= 1 &&
            event.translationY > 0
          ) {
            if (!draggingSheet.current) {
              draggingSheet.current = true;
              sheetStartTranslationY.current = event.translationY;
            }
            translateY.setValue(
              Math.max(0, event.translationY - sheetStartTranslationY.current),
            );
          }
        })
        .onEnd((event) => {
          if (!draggingSheet.current || isDismissing.current) return;
          const sheetDistance = Math.max(
            0,
            event.translationY - sheetStartTranslationY.current,
          );

          if (sheetDistance > 110 || event.velocityY > 850) {
            isDismissing.current = true;
            Animated.timing(translateY, {
              toValue: 900,
              duration: 190,
              useNativeDriver: true,
            }).start(({ finished }) => {
              if (finished) onDismissRef.current();
            });
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 24,
            stiffness: 260,
            mass: 0.8,
          }).start();
        }),
    [enabled, isDismissing, scrollGesture, scrollOffsetY, translateY],
  );

  return { panGesture, scrollGesture };
}
