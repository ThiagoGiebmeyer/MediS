import { Text, TextProps } from 'react-native';
import React from 'react';
import { cn } from "@/lib";

type Variant = 'title' | 'body' | 'secondary';

export function AppText({
  variant = 'body',
  className,
  children,
  ...props
}: TextProps & { variant?: Variant }) {
  const base =
    variant === 'title'
      ? 'text-primary text-2xl font-bold'
      : variant === 'secondary'
        ? 'text-secondary opacity-70'
        : 'text-primary text-base';

  return (
    <Text className={cn(base, className)} {...props}>
      {children}
    </Text>
  );
}
