import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Padding that keeps a screen's content clear of what the system places along
// the left and right edges, like the tab bar and status area of an unfolded
// iPhone Duo. Both sides are zero on a regular phone held upright.
export const useSideInsets = () => {
  const { left, right } = useSafeAreaInsets();

  return useMemo(
    () => ({ paddingLeft: left, paddingRight: right }),
    [left, right]
  );
};
