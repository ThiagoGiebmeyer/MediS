import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "../ThemedText";

type PrimaryButtonProps = {
  title: string;
  fn: () => void;
  style?: {};
};

export default function PrimaryButton({
  title = " ",
  fn = () => {},
  style = {},
}: PrimaryButtonProps) {
  const colorScheme = useColorScheme() ?? "dark";

  return (
    <TouchableOpacity
      onPress={fn}
      style={{
        width: "90%",
        backgroundColor: Colors[colorScheme].tint,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        borderTopStartRadius: 50,
        borderBottomEndRadius: 50,
        outline: "none",
        ...style,
      }}
    >
      <ThemedText
        type="subtitle"
        style={{
          color: Colors[colorScheme].text,
        }}
      >
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
}
