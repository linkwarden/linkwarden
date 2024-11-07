import clsx from "clsx";
import React from "react";

type Props = {
  className?: string;
  vertical?: boolean;
};

function Divider({ className, vertical = false }: Props) {
  return vertical ? (
    <hr className={clsx("border-neutral-content border-l h-full", className)} />
  ) : (
    <hr className={clsx("border-neutral-content border-t", className)} />
  );
}

export default Divider;
