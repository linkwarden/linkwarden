// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Link from "next/link";
import React, { ReactElement } from "react";

interface SidebarItemProps {
  text: string;
  icon: ReactElement;
  path: string;
}

export default function ({ text, icon, path }: SidebarItemProps) {
  return (
    <Link href={path}>
      <div className="hover:bg-gray-50 hover:outline outline-sky-100 outline-1 duration-100 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2">
        {React.cloneElement(icon, {
          className: "w-4 text-sky-300",
        })}
        <p className="text-sky-900">{text}</p>
      </div>
    </Link>
  );
}
