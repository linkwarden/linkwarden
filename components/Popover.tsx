import React from "react";
import ClickAwayHandler from "./ClickAwayHandler";

type Props = {
  children: React.ReactNode;
  onClose: Function;
  className?: string;
};

const Popover = ({ children, className, onClose }: Props) => {
  return (
    <ClickAwayHandler
      onClickOutside={() => onClose()}
      className={`absolute z-50 ${className || ""}`}
    >
      {children}
    </ClickAwayHandler>
  );
};

export default Popover;
