import { Colors } from "@/constants/Colors";
import React from "react";
import { useColorScheme } from "react-native";
import Svg, { Line, Polyline, Path } from "react-native-svg";

const PlantGrowthIcon = ({
  width = 100,
  height = 100,
  color = "",
  style = {},
}) => {
  const colorScheme = useColorScheme() ?? "dark";
  color = color.length
    ? color
    : colorScheme === "dark"
    ? Colors.dark.icon
    : Colors.light.icon;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 200 200"
      fill="none"
      style={{ ...style }}
    >
      {/* Linha central com seta */}
      <Line
        x1="100"
        y1="180"
        x2="100"
        y2="20"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Polyline
        points="80,40 100,20 120,40"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Folha esquerda mais realista */}
      <Path
        d="M100 90 C60 50 30 90 60 130"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M100 140 Q50 110 50 160 Q50 210 100 180"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Folha direita mais realista */}
      <Path
        d="M100 90 C140 50 170 90 140 130 C110 170 100 140 100 120"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M100 140 Q150 110 150 160 Q150 210 100 180"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default PlantGrowthIcon;
