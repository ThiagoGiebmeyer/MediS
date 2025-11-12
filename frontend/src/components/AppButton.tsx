import { TouchableOpacity, Text, TouchableOpacityProps } from "react-native";
import React from "react";
import { cn } from "@/lib";

type Variant = "primary" | "secondary";

export function AppButton({
  variant = "primary",
  title,
  className,
  ...props
}: TouchableOpacityProps & { variant?: Variant; title: string }) {
  const styles =
    variant === "primary"
      ? "bg-primary"
      : "bg-surface border border-secondary";

  const textColor = variant === "primary" ? "text-background" : "text-secondary";

  return (
    <TouchableOpacity
      className={cn("rounded-xl px-6 py-3 items-center", styles, className)}
      {...props}
    >
      <Text className={cn("font-semibold text-lg", textColor)}>{title}</Text>
    </TouchableOpacity>
  );
}
