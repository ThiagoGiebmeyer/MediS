import React, { ReactNode } from "react";
import { ThemedView } from "../ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "react-native";

interface HeaderRootProps {
  children: ReactNode;
}

export function HeaderRoot({ children }: HeaderRootProps) {
  const colorScheme = useColorScheme() ?? "dark";

  return (
    <ThemedView
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: 'transparent',
        paddingVertical: 16,
        borderBottomColor:
          colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint,
      }}
    >
      {children}
    </ThemedView>
  );
}
