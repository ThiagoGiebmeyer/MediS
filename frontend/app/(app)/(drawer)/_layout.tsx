import { Redirect } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSession } from "@/ctx";
import AnimatedLogo from "@/components/AnimatedLogo";
import { Drawer } from "expo-router/drawer";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function AppLayout() {
  const { session, isLoading } = useSession();
  const colorScheme = useColorScheme() ?? "dark";

  const focusedTextColor =
    colorScheme === "dark" ? Colors.dark.text : Colors.light.text;

  const focusedIconColor =
    colorScheme === "dark" ? Colors.dark.focusedIcon : Colors.light.focusedIcon;

  const IconColor =
    colorScheme === "dark" ? Colors.dark.focusedIcon : Colors.light.focusedIcon;

  function renderSessionLoading() {
    return AnimatedLogo();
  }

  if (isLoading) {
    return renderSessionLoading();
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerType: "front",
          drawerStatusBarAnimation: "slide",
          drawerStyle: {
            backgroundColor: Colors[colorScheme].drawer.background,
          },
          drawerActiveTintColor: Colors[colorScheme].tint,
          drawerActiveBackgroundColor: Colors[colorScheme].drawer.background,
          drawerLabelStyle: {
            fontSize: 18,
            marginLeft: -8,
            padding: 8,
            color: focusedTextColor,
          },
          drawerItemStyle: {
            borderRadius: 8,
            marginVertical: 4,
          },
        }}
        initialRouteName="(tabs)"
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: "Início",
            title: "Início",
            drawerLabelStyle: {
              color: focusedIconColor,
              fontSize: 18,
            },
            drawerIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={28}
                color={focused ? focusedIconColor : IconColor}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel: "Perfil",
            title: "Perfil",
            drawerIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={28}
                color={focused ? focusedIconColor : IconColor}
              />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
