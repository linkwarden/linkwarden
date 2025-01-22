import React from "react";
import ClickAwayHandler from "./ClickAwayHandler";

type Props = {
  children: React.ReactNode;
  onClose: Function;
  className?: string;
  style?: React.CSSProperties;
};

const Popover = ({ children, className, onClose, style }: Props) => {
  return (
    <ClickAwayHandler
      onClickOutside={() => onClose()}
      className={`absolute z-50 ${className || ""}`}
      style={style}
    >
      {children}
    </ClickAwayHandler>
  );
};

export default Popover;
