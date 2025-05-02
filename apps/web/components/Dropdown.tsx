import Link from "next/link";
import React, { MouseEventHandler, useEffect, useState } from "react";
import ClickAwayHandler from "./ClickAwayHandler";

type MenuItem =
  | {
      name: string;
      onClick: MouseEventHandler;
      href?: string;
    }
  | {
      name: string;
      onClick?: MouseEventHandler;
      href: string;
    }
  | undefined;

type Props = {
  onClickOutside: Function;
  className?: string;
  items: MenuItem[];
  points?: { x: number; y: number };
  style?: React.CSSProperties;
};

export default function Dropdown({
  points,
  onClickOutside,
  className,
  items,
}: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>();
  const [dropdownHeight, setDropdownHeight] = useState<number>();
  const [dropdownWidth, setDropdownWidth] = useState<number>();

  function convertRemToPixels(rem: number) {
    return (
      rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
  }

  useEffect(() => {
    if (points) {
      let finalX = points.x;
      let finalY = points.y;

      // Check for x-axis overflow (left side)
      if (dropdownWidth && points.x + dropdownWidth > window.innerWidth) {
        finalX = points.x - dropdownWidth;
      }

      // Check for y-axis overflow (bottom side)
      if (dropdownHeight && points.y + dropdownHeight > window.innerHeight) {
        finalY =
          window.innerHeight -
          (dropdownHeight + (window.innerHeight - points.y));
      }

      setPos({ x: finalX, y: finalY });
    }
  }, [points, dropdownHeight]);

  return (
    (!points || pos) && (
      <ClickAwayHandler
        onMount={(e) => {
          setDropdownHeight(e.height);
          setDropdownWidth(e.width);
        }}
        style={
          points
            ? {
                position: "fixed",
                top: `${pos?.y}px`,
                left: `${pos?.x}px`,
              }
            : undefined
        }
        onClickOutside={onClickOutside}
        className={`${
          className || ""
        } py-1 shadow-md border border-neutral-content bg-base-200 rounded-md flex flex-col z-20`}
      >
        {items.map((e, i) => {
          const inner = e && (
            <div className="cursor-pointer rounded-md">
              <div className="flex items-center gap-2 py-1 px-2 hover:bg-base-100 duration-100">
                <p className="select-none">{e.name}</p>
              </div>
            </div>
          );

          return e && e.href ? (
            <Link key={i} href={e.href}>
              {inner}
            </Link>
          ) : (
            e && (
              <div key={i} onClick={e.onClick}>
                {inner}
              </div>
            )
          );
        })}
      </ClickAwayHandler>
    )
  );
}
