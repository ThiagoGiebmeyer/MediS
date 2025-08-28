import { Icons } from "@/lib/icons";
import React, { forwardRef } from "react";
import { ViewStyle } from "react-native";
import Animated from "react-native-reanimated";

type MIconProps = {
  name: keyof typeof Icons;
  color?: string;
  size?: number;
  style?: ViewStyle;
};

const MIcon = forwardRef<any, MIconProps>(({ name, color = "black", size = 24, style }: MIconProps, ref) => {
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn(`Ícone "${String(name)}" não encontrado em MIcon.`);
    return null;
  }

  return (
    <Animated.View ref={ref} style={style}> 
      <IconComponent color={color} size={size} />
    </Animated.View>
  );
});

export default MIcon;
