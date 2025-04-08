import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import { CustomTabBarButton } from "@/components/navigation/CustomTabBarButton";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TabsLayout() {
  const colorScheme = useColorScheme() ?? "dark";
  const focusedIconColor =
    colorScheme === "dark" ? Colors.light.focusedIcon : Colors.dark.focusedIcon;
  const IconColor =
    colorScheme === "dark" ? Colors.dark.text : Colors.light.text;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme].tint,
          borderTopEndRadius: 8,
          borderTopStartRadius: 8,
          position: "absolute",
          borderTopWidth: 0,
          width: "100%",
          height: 60,
        },
        tabBarIconStyle: {
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        },
        tabBarLabelStyle: {
          fontSize: 18,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              style={{
                borderEndEndRadius: 50,
              }}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={28}
              color={focused ? focusedIconColor : IconColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              style={{
                borderBottomStartRadius: 50,
              }}
            />
          ),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={28}
              color={focused ? focusedIconColor : IconColor}
            />
          ),
        }}
      />
    </Tabs>
  );
}
