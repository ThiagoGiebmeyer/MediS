import React from "react";
import {
  KeyboardTypeOptions,
  TextInput,
  TextInputProps,
  useColorScheme,
} from "react-native";
import { ThemedView } from "../ThemedView";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "../ThemedText";

type CustomTextInputProps = {
  placeholder: string;
  onChangeText: (text: string) => void;
  value: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  style?: {};
  rest?: TextInputProps;
};

export default function CustomTextInput({
  placeholder = " ",
  onChangeText = () => "",
  value = "",
  secureTextEntry = false,
  keyboardType = "default",
  style = {},
  ...rest
}: CustomTextInputProps) {
  const colorScheme = useColorScheme() ?? "dark";

  return (
    <TextInput
      style={{
        width: "100%",
        padding: 16,
        borderWidth: 1,
        borderColor: Colors[colorScheme].tint,
        borderRadius: 8,
        backgroundColor: Colors[colorScheme].drawer.background,
        color: Colors[colorScheme].text,
        outline: "none",
        ...style,
      }}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      placeholderTextColor={Colors[colorScheme].tint}
      {...rest}
    />
  );
}
