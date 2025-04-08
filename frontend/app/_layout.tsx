import { useCallback, useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { SessionProvider, useSession } from "@/ctx";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import AnimatedLogo from "@/components/AnimatedLogo";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  fade: true,
});

export default function App() {
  const { session } = useSession();
  const colorScheme = useColorScheme() ?? "dark";
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Entypo.font);
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useCallback(() => {
    if (appIsReady) {
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <AnimatedLogo />;
  } else
    return (
      <>
        <SessionProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack
              initialRouteName={session ? "sign-in" : "(app)"}
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SessionProvider>
        <Toast />
      </>
    );
}
