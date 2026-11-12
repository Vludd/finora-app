import { memo, useState } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { GestureDetector, type GestureType } from "react-native-gesture-handler";
import { formatAmountInput } from "@/shared/lib/format";

type Props = {
  initialValue: string;
  onValueChange: (value: string) => void;
  gesture?: GestureType;
} & Pick<TextInputProps, "placeholder" | "placeholderTextColor" | "className" | "style">;

function FormattedAmountInputComponent({
  initialValue,
  onValueChange,
  gesture,
  ...inputProps
}: Props) {
  const [value, setValue] = useState(initialValue);
  const input = (
    <TextInput
      {...inputProps}
      value={value}
      onChangeText={(text) => {
        const formatted = formatAmountInput(text);
        setValue(formatted);
        onValueChange(formatted);
      }}
      keyboardType="decimal-pad"
    />
  );

  return gesture ? <GestureDetector gesture={gesture}>{input}</GestureDetector> : input;
}

export const FormattedAmountInput = memo(FormattedAmountInputComponent);
