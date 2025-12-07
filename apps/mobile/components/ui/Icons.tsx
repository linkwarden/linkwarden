import React from "react";
import Svg, { Path, Circle, SvgProps } from "react-native-svg";

export const Chromium = (props: SvgProps) => (
  <Svg
    width={21}
    height={21}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Path d="M10.88 21.94 15.46 14" />
    <Path d="M21.17 8H12" />
    <Path d="M3.95 6.06 8.54 14" />
    <Circle cx={12} cy={12} r={10} />
    <Circle cx={12} cy={12} r={4} />
  </Svg>
);
