import { View, ViewProps } from "react-native";
import React from "react";
import { cn } from "@/lib";

export function AppCard({ className, children, ...props }: ViewProps & { children: React.ReactNode }) {
  return (
    <View
      className={cn(
        "bg-surface rounded-2xl p-4 border border-secondary/20 shadow-lg shadow-black/40",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
