import { View, ViewProps } from "react-native";
import React from "react";
import { cn } from "@/lib";

export function AppScreen({ className, children, ...props }: ViewProps & { children: React.ReactNode }) {
  return (
    <View className={cn("flex-1 bg-background px-4 py-6", className)} {...props}>
      {children}
    </View>
  );
}
