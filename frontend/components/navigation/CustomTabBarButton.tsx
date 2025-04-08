import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

type CustomTabBarButtonProps = {
  onPress?: () => void;
  accessibilityState?: { selected?: boolean };
  style?: ViewStyle;
  children?: React.ReactNode;
};

export const CustomTabBarButton = ({
  onPress,
  accessibilityState,
  style,
  children,
}: CustomTabBarButtonProps) => {
  const colorScheme = useColorScheme() ?? "dark";

  const baseStyle: ViewStyle = {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  };

  const backgroundStyle: ViewStyle = {
    backgroundColor: Colors[colorScheme].background,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        baseStyle,
        style,
        !accessibilityState?.selected ? backgroundStyle : null,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};
