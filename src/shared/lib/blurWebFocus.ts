import { Platform } from "react-native";

/**
 * Release browser focus before navigating away from a React Native Web
 * screen. Native Stack hides the previous screen from assistive technology;
 * a focused descendant would otherwise remain inside an aria-hidden subtree.
 */
export function blurWebFocus(target: unknown) {
  if (Platform.OS !== "web" || !target || typeof target !== "object") {
    return;
  }

  const element = target as { blur?: () => void };
  element.blur?.();
}
