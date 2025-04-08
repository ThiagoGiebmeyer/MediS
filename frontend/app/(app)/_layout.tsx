import { Redirect, Stack } from "expo-router";

import { useSession } from "@/ctx";
import AnimatedLogo from "@/components/AnimatedLogo";
export default function AppLayout() {
  const { session, isLoading } = useSession();

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
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
