import Link from "next/link";
import React, { MouseEventHandler } from "react";
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
    };

type Props = {
  onClickOutside: Function;
  className?: string;
  items: MenuItem[];
};

export default function Dropdown({ onClickOutside, className, items }: Props) {
  return (
    <ClickAwayHandler
      onClickOutside={onClickOutside}
      className={`${className} border border-sky-100 py-1 shadow-md bg-gray-50 rounded-md flex flex-col z-10`}
    >
      {items.map((e, i) => {
        const inner = (
          <div className="cursor-pointer rounded-md">
            <div className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200 duration-100">
              <p className="text-sky-900 select-none">{e.name}</p>
            </div>
          </div>
        );

        return e.href ? (
          <Link key={i} href={e.href}>
            {inner}
          </Link>
        ) : (
          <div key={i} onClick={e.onClick}>
            {inner}
          </div>
        );
      })}
    </ClickAwayHandler>
  );
}
