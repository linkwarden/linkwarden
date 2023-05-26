// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Link from "next/link";
import React, { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";

interface SidebarItemProps {
  text: string;
  icon: ReactElement;
  path: string;
  className?: string;
}

export default function ({ text, icon, path, className }: SidebarItemProps) {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (router.asPath === path) setActive(true);
    else setActive(false);
  }, [router]);

  return (
    <Link href={path}>
      <div
        className={`${
          active ? "bg-sky-500" : "hover:bg-gray-50 hover:outline bg-gray-100"
        } outline-sky-100 outline-1 duration-100 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2 w-full ${className}`}
      >
        {React.cloneElement(icon, {
          className: `w-4 ${active ? "text-white" : "text-sky-300"}`,
        })}
        <p className={`${active ? "text-white" : "text-sky-900"} truncate`}>
          {text}
        </p>
      </div>
    </Link>
  );
}
