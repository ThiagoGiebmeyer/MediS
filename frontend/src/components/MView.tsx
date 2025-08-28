import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/utils"; // ou substitua com sua função de class merge

type MViewProps = ViewProps & {
  className?: string;
};

function MView({ className, style, ...props }: MViewProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-white dark:bg-surface-a10",
  };

  return <View className={cn(variantStyles, className)} {...props} />;
}

export default MView;
