import { cssInterop } from "nativewind";
import type { ComponentType } from "react";
import {
  SafeAreaView as SafeAreaViewBase,
  type SafeAreaViewProps,
} from "react-native-safe-area-context";

type NativewindSafeAreaViewProps = SafeAreaViewProps & {
  className?: string;
};

const InteropSafeAreaView = SafeAreaViewBase as ComponentType<NativewindSafeAreaViewProps>;

cssInterop(InteropSafeAreaView, { className: "style" });

export function SafeAreaView(props: NativewindSafeAreaViewProps) {
  return <InteropSafeAreaView {...props} />;
}
