import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
      <div className="hover:bg-gray-50 hover:outline outline-sky-100 outline-1 duration-100 rounded my-1 p-3 cursor-pointer flex items-center gap-2">
        {React.cloneElement(icon, {
          className: "w-4 text-sky-300",
        })}
        <p className="text-sky-900">{text}</p>
      </div>
    </Link>
  );
}
