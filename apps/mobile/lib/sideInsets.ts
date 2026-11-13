import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Padding that keeps a screen's content clear of what the system places along
// the left and right edges, like the tab bar and status area of an iPhone Duo.
// Both sides are zero on a regular phone held upright. Action sheets take it
// in their containerStyle, since react-native-actions-sheet only applies the
// top and bottom insets.
export const useSideInsets = () => {
  const { left, right } = useSafeAreaInsets();

  return useMemo(
    () => ({ paddingLeft: left, paddingRight: right }),
    [left, right]
  );
};
