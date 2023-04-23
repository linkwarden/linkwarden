// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

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
      className={`${className} border border-sky-100 shadow-md mb-5 bg-gray-50 rounded-md flex flex-col`}
    >
      {items.map((e, i) => {
        const inner = (
          <div className="cursor-pointer rounded-md hover:bg-white hover:outline outline-sky-100 outline-1 duration-100">
            <div className="flex items-center gap-2 p-2 rounded-md hover:opacity-60 duration-100">
              {React.cloneElement(e.icon, {
                className: "text-sky-500 w-5 h-5",
              })}
              <p className="text-sky-900">{e.name}</p>
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
