import React, { useEffect } from "react";
import { CameraView, useCameraPermissions, Camera } from "expo-camera";
import MView from "./MView";
import { OrbitProgress } from "react-loading-indicators";
import { View } from "react-native";

const MCamera = React.forwardRef<typeof Camera, {}>((props, ref) => {
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission || !permission.granted) {
    return (
      <MView className="flex-1 items-center justify-center">
        <OrbitProgress variant="spokes" color="white" size="small" />
      </MView>
    );
  }

  return (
    <View className="flex-1 w-full h-full">
      <CameraView className="flex-1" facing="back" ref={ref} />
    </View>
  );
});

export default MCamera;
