import Link from "next/link";
import React, { MouseEventHandler, ReactElement } from "react";
import ClickAwayHandler from "./ClickAwayHandler";

type MenuItem = {
  name: string;
  icon: ReactElement;
  onClick?: MouseEventHandler;
  href?: string;
};

type Props = {
  onClickOutside: Function;
  className?: string;
  items: MenuItem[];
};

export default function ({ onClickOutside, className, items }: Props) {
  return (
    <ClickAwayHandler
      onClickOutside={onClickOutside}
      className={`${className} border border-sky-100 shadow mb-5 bg-gray-50 p-4 rounded flex flex-col gap-4`}
    >
      {items.map((e, i) => {
        return e.href ? (
          <Link key={i} href={e.href}>
            <div className="flex items-center gap-2 px-2 cursor-pointer">
              {React.cloneElement(e.icon, {
                className: "text-sky-500 w-5 h-5",
              })}
              <p className="text-sky-900">{e.name}</p>
            </div>
          </Link>
        ) : (
          <div key={i} onClick={e.onClick}>
            <div className="flex items-center gap-2 px-2 cursor-pointer">
              {React.cloneElement(e.icon, {
                className: "text-sky-500 w-5 h-5",
              })}
              <p className="text-sky-900">{e.name}</p>
            </div>
          </div>
        );
      })}
    </ClickAwayHandler>
  );
}
