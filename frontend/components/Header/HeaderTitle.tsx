import React from "react";
import { ThemedText } from "../ThemedText";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  const colorScheme = useColorScheme() ?? "dark";

  return (
    <ThemedText
      type="title"
      style={{
        fontSize: 18,
        marginLeft: 8,
        flex: 1,
        color: Colors[colorScheme].tint,
      }}
    >
      {title}
    </ThemedText>
  );
}
