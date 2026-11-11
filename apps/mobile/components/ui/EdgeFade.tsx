import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { rawTheme, ThemeName } from "@/lib/colors";

// As wide as the padding at the ends of the lists it covers, so a list that
// is scrolled all the way to that side isn't dimmed
const WIDTH = 20;

/**
 * Fades a horizontally scrolling list into the background where the screen's
 * side inset cuts it off before the edge of the display, like next to the tab
 * bar of an iPhone Duo. Renders nothing on a side without an inset.
 *
 * Place it after the list, inside a view that wraps only the list.
 */
export default function EdgeFade() {
  const { left, right } = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const color = rawTheme[colorScheme as ThemeName]["base-100"];

  const fade = (side: "left" | "right") => (
    <Svg
      width={WIDTH}
      height="100%"
      pointerEvents="none"
      style={[styles.fade, side === "left" ? { left: 0 } : { right: 0 }]}
    >
      <Defs>
        <LinearGradient id={`edge-fade-${side}`} x1="0" y1="0" x2="1" y2="0">
          <Stop
            offset="0"
            stopColor={color}
            stopOpacity={side === "left" ? 1 : 0}
          />
          <Stop
            offset="1"
            stopColor={color}
            stopOpacity={side === "left" ? 0 : 1}
          />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#edge-fade-${side})`} />
    </Svg>
  );

  return (
    <>
      {left > 0 && fade("left")}
      {right > 0 && fade("right")}
    </>
  );
}

const styles = StyleSheet.create({
  fade: {
    position: "absolute",
    top: 0,
    bottom: 0,
  },
});
