// components/AppText.tsx
import { Text, TextProps } from 'react-native';
import React from 'react';

type AppTextProps = TextProps & {
  weight?: 'regular' | 'semibold' | 'bold';
};

export default function ThemedText({ style, weight = 'regular', ...props }: AppTextProps) {
  let fontFamily = 'GeistRegular';
  if (weight === 'semibold') fontFamily = 'GeistSemiBold';
  if (weight === 'bold') fontFamily = 'GeistBold';

  return <Text {...props} style={[{ fontFamily }, style]} />;
}
