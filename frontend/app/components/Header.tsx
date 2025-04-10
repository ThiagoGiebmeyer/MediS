// Header.tsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface HeaderProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  return (
    <View className="w-full px-4 py-5 flex-row items-center justify-between bg-primary-a0 dark:bg-surface-a0">
      <Text className="text-white dark:text-gray-100 text-lg font-semibold">
        {title}
      </Text>
    </View>
  );
};

export default Header;
