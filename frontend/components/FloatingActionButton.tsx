import React from "react";
import { ThemedView } from "./ThemedView";
import { Ionicons } from "@expo/vector-icons";

import { ComponentProps } from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";

type FloatingActionButtonProps = {
  iconName: ComponentProps<typeof Ionicons>["name"];
  libraryName: string;
  onPress?: () => void;
  location?: {
    marginRigth?: number;
    marginBottom?: number;
  };
};

export default function FloatingActionButton({
  iconName,
  libraryName,
  onPress,
  location = { marginRigth: 16, marginBottom: 60 },
}: FloatingActionButtonProps) {
  const Icon = libraryName === "Ionicons" ? Ionicons : Ionicons;
  const colorScheme = useColorScheme() ?? "dark";

  const backgroundColorTheme = Colors[colorScheme].backgroundInvert;
  const colorTheme = Colors[colorScheme].text;

  return (
    <>
      <TouchableOpacity
        onPress={onPress ?? (() => {})}
        style={{
          position: "absolute",
          zIndex: 1,
          bottom: location.marginBottom,
          right: location.marginRigth,
          backgroundColor: backgroundColorTheme,
        }}
      >
        <Icon
          name={iconName}
          size={32}
          backgroundColor={backgroundColorTheme}
          color={colorTheme}
          style={{
            borderRadius: 50,
            padding: 16,
            position: "absolute",
            bottom: 20,
            right: 20,
            backgroundColor: backgroundColorTheme,
          }}
        />
      </TouchableOpacity>
    </>
  );
}
