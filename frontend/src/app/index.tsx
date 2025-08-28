import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useSession } from "@/ctx";

export default function AppLayout() {
  const { session, isLoading } = useSession();

  useEffect(() => {
    console.log({ session, isLoading });
    if (!isLoading) {
      if (!session) { router.replace("/(auth)"); }
      else { router.replace("/(app)"); }
    }
  }, [session, isLoading]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}