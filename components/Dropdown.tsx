// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

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
