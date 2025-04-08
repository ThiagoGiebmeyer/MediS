import { Easing } from "react-native-reanimated";

import { ThemedView } from "@/components/ThemedView";
import { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PlantGrowthIcon from "@/components/ui/IconPlantGrowth";

export default function AnimatedLogo() {
  function renderSessionLoading() {
    const scaleAnimation = useSharedValue(0);
    const plantPositionAnimation = useSharedValue(0);

    useEffect(() => {
      scaleAnimation.value = withTiming(2, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
    }, []);

    const animatedPlantStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scaleAnimation.value },
        { translateX: plantPositionAnimation.value },
      ],
      opacity: scaleAnimation.value,
      position: "absolute", // Para que a planta comece atrás do texto
    }));

    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Animated.View style={animatedPlantStyle}>
          <PlantGrowthIcon width={100} height={100} color="#ECEDEE" />
        </Animated.View>
      </ThemedView>
    );
  }

  return renderSessionLoading();
}
