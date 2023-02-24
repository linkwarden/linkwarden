import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Collection } from "@prisma/client";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { MouseEventHandler } from "react";

interface TextObject {
  name: string;
}

interface SidebarItemProps {
  item: Collection | TextObject;
  icon: IconProp;
  onClick?: MouseEventHandler;
}

export default function ({ item, icon, onClick }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className="hover:bg-gray-50 duration-100 text-sky-900 rounded my-1 p-3 cursor-pointer flex items-center gap-2"
    >
      <FontAwesomeIcon icon={icon} className="w-4 text-sky-300" />
      <p>{item.name}</p>
    </div>
  );
}
