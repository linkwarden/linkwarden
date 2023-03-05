import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { MouseEventHandler } from "react";
import Link from "next/link";

interface SidebarItemProps {
  text: string;
  icon: IconProp;
  path: string;
}

export default function ({ text, icon, path }: SidebarItemProps) {
  return (
    <Link href={path}>
      <div className="hover:bg-gray-50 duration-100 text-sky-900 rounded my-1 p-3 cursor-pointer flex items-center gap-2">
        <FontAwesomeIcon icon={icon} className="w-4 text-sky-300" />
        <p>{text}</p>
      </div>
    </Link>
  );
}
