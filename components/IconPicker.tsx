import { icons } from "@/lib/client/icons";
import React, { useMemo, useState } from "react";
import Fuse from "fuse.js";
import TextInput from "./TextInput";
import Popover from "./Popover";
import { HexColorPicker } from "react-colorful";
import Icon from "./Icon";

const fuse = new Fuse(icons, {
  keys: [{ name: "name", weight: 4 }, "tags", "categories"],
  threshold: 0.2,
  useExtendedSearch: true,
});

type Props = {
  onClose: Function;
  alignment?: "left" | "right" | "bottom" | "top";
  color: string;
  setColor: Function;
  iconName: string;
  setIconName: Function;
  weight: "light" | "regular" | "bold" | "fill" | "duotone";
  setWeight: Function;
  className?: string;
};

const IconPicker = ({
  onClose,
  alignment,
  color,
  setColor,
  iconName,
  setIconName,
  weight,
  setWeight,
  className,
}: Props) => {
  const [query, setQuery] = useState("");

  const filteredQueryResultsSelector = useMemo(() => {
    if (!query) {
      return icons;
    }
    return fuse.search(query).map((result) => result.item);
  }, [query]);

  return (
    <Popover
      onClose={onClose}
      className={
        className +
        " bg-base-200 border border-neutral-content p-3 h-72 w-72 overflow-y-auto rounded-lg"
      }
    >
      <div>
        <div className="mb-3 flex gap-3">
          <div className="w-full flex flex-col justify-between">
            <Icon
              icon={iconName}
              size={80}
              weight={weight as any}
              color={color}
              className="mx-auto"
            />

            <select
              className="border border-neutral-content bg-base-100 focus:outline-none focus:border-primary duration-100 w-full rounded-[0.375rem] h-7"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            >
              <option value="regular">Regular</option>
              <option value="thin">Thin</option>
              <option value="light">Light</option>
              <option value="bold">Bold</option>
              <option value="fill">Fill</option>
              <option value="duotone">Duotone</option>
            </select>
          </div>
          <HexColorPicker color={color} onChange={(e) => setColor(e)} />
        </div>

        <TextInput
          className="p-2 rounded w-full mb-3 h-7 text-sm"
          placeholder="Search icons"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="grid grid-cols-5 gap-1 w-full">
          {filteredQueryResultsSelector.map((icon) => {
            const IconComponent = icon.Icon;
            return (
              <div
                key={icon.pascal_name}
                onClick={() => setIconName(icon.pascal_name)}
                className={`cursor-pointer btn p-1 box-border ${
                  icon.pascal_name === iconName
                    ? "outline outline-1 outline-primary"
                    : ""
                }`}
              >
                <IconComponent size={32} weight={weight} color={color} />
              </div>
            );
          })}
        </div>
      </div>
    </Popover>
  );
};

export default IconPicker;
