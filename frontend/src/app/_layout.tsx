import { Slot } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "@/ctx";
import { SessionProvider } from "@/ctx";

export default function RootLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SessionProvider>
      {session ? <Slot name="app" /> : <Slot name="auth" />}
    </SessionProvider>
  );
}
