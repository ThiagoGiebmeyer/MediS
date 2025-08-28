import React from "react";
import { Text, TextProps } from "react-native";
import { cn } from "@/utils"; // ou substitua com sua função de class merge

type MTextProps = TextProps & {
  className?: string;
};

function MText({ className, ...props }: MTextProps) {
  const variantStyles = "font-geist text-surface-a0 dark:text-white text-base";

  return <Text className={cn(variantStyles, className)} {...props} />;
}

export default MText;
