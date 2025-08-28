import React from "react";
import MView from "./MView";
import MIcon from "./MIcon";
import { TouchableOpacity } from "react-native";
import { Icons } from "@/lib/icons";
import { OrbitProgress } from "react-loading-indicators";

type MTabBarProps = {
  icon?: keyof typeof Icons;
  onPress?: () => void;
  renderLoading?: boolean;
};

function MTabBar({
  icon = "Camera",
  onPress = () => {},
  renderLoading = false,
}: MTabBarProps) {
  return (
    <>
      <MView className="absolute bottom-0 left-0 right-0 h-16 bg-primary-a0 rounded-t-3xl">
        <MView className="flex-1 items-center justify-center bottom-6">
          <MView className="dark:bg-primary-a0 border-2 border-primary-a0 rounded-full p-4 bg-primary-a0 shadow-lg">
            {renderLoading ? (
              <MView>
                <OrbitProgress
                  variant="spokes"
                  color="white"
                  size="small"
                  text=""
                  textColor=""
                />
              </MView>
            ) : (
              <TouchableOpacity onPress={onPress}>
                <MIcon name={icon} color="white" size={48} />
              </TouchableOpacity>
            )}
          </MView>
        </MView>
      </MView>
    </>
  );
}

export default MTabBar;
