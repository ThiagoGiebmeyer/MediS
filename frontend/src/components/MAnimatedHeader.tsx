import React, { useEffect } from "react";
import { Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import MIcon from "./MIcon";
import MText from "./MText";
import MView from "./MView";
import { FourSquare, OrbitProgress } from "react-loading-indicators";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const MAnimatedHeader = ({ loading }: { loading: boolean }) => {
  const height = useSharedValue(SCREEN_HEIGHT);
  const border = useSharedValue(0);

  useEffect(() => {
    if (!loading) {
      height.value = withTiming(160, {
        duration: 800,
      });
      border.value = withTiming(24, {
        duration: 800,
      });
    }
  }, [loading]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
      borderBottomLeftRadius: border.value,
      borderBottomRightRadius: border.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: "100%",
          position: "absolute",
          top: 0,
          backgroundColor: "#ff4400",
          overflow: "hidden",
        },
        animatedStyle,
      ]}
    >
      <Animated.View
        style={{
          width: "90%",
          alignSelf: "center",
          marginTop: 40,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
        }}
      >
        {loading ? (
          <></>
        ) : (
          <>
            <MIcon name={"ChevronLeft"} color="white" size={24} />
            <MText className="font-geistSemiBold text-xl text-white">
              Olá, Thiago!
            </MText>
          </>
        )}
      </Animated.View>

      <MView className="flex-1 items-center justify-center">
        {loading && (
          <OrbitProgress
            variant="spokes"
            color="white"
            size="small"
            text=""
            textColor=""
          />
        )}
      </MView>
    </Animated.View>
  );
};

export default MAnimatedHeader;
