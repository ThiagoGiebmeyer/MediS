import React from "react";
import { TouchableOpacity, useColorScheme } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";

interface HeaderActionProps {
  action: () => void;
  actionLongPress?: () => void;
  iconName?: any;
  libraryName?: "AntDesign" | "Ionicons";
  alignLeft?: boolean;
}

export function HeaderAction({
  action,
  actionLongPress,
  iconName,
  libraryName = "AntDesign",
  alignLeft = false,
}: HeaderActionProps) {
  const colorScheme = useColorScheme() ?? "dark";

  const customAction = action || (() => {});
  const iconColor =
    colorScheme === "dark" ? Colors.dark.tint : Colors.light.tint;

  return (
    <TouchableOpacity
      onPress={customAction}
      onLongPress={actionLongPress ? actionLongPress : () => {}}
      style={
        alignLeft ? { marginLeft: "5%" } : { marginRight: "5%" }
      }
    >
      {iconName && libraryName === "AntDesign" && (
        <AntDesign name={iconName} size={28} color={iconColor} />
      )}
      {iconName && libraryName === "Ionicons" && (
        <Ionicons name={iconName} size={28} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}
