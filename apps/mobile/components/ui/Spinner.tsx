import React, { forwardRef } from "react";
import { RefreshControl, RefreshControlProps } from "react-native";

const Spinner = forwardRef<RefreshControl, RefreshControlProps>(
  (props, ref) => {
    return <RefreshControl ref={ref} {...props} />;
  }
);

export default Spinner;
