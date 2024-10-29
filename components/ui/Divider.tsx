import clsx from "clsx";
import React from "react";

type Props = {
  className?: string;
};

function Divider({ className }: Props) {
  return <hr className={clsx("border-neutral-content border-t", className)} />;
}

export default Divider;
