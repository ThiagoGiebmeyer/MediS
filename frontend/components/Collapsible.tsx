import { PropsWithChildren, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";

export function Collapsible({
  children,
  title,
  style = {},
}: PropsWithChildren & { title: string; style?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? "dark";

  const rotateValue = useSharedValue(0);
  const opacity = useSharedValue(0);

  const config = {
    duration: 200,
    easing: Easing.ease,
  };

  const styleAnimated = useAnimatedStyle(() => {
    const rotation = interpolate(rotateValue.value, [0, 1], [0, 90]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const styleAnimatedHeight = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={{ ...style }}>
      <TouchableOpacity
        style={{
          ...styles.heading,
          flex: 1,
          justifyContent: "space-between",
          borderRadius: 8,
        }}
        onPress={() => {
          rotateValue.value = withTiming(isOpen ? 0 : 1, config);
          opacity.value = withTiming(isOpen ? 0 : 1, {
            ...config,
            duration: 500,
          });
          setIsOpen((value) => !value);
        }}
        activeOpacity={0.8}
      >
        <ThemedText type="title" style={{ color: Colors[theme].text }}>
          {title}
        </ThemedText>
        <Animated.View style={styleAnimated}>
          <IconSymbol
            name="chevron.right"
            size={18}
            weight="medium"
            color={Colors[theme].text}
            style={styleAnimated} // Corrigido
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={styleAnimatedHeight}>
        {isOpen && children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  content: {},
});
