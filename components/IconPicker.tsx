import { icons } from "@/lib/client/icons";
import React, { useMemo, useState, lazy, Suspense } from "react";
import Fuse from "fuse.js";
import TextInput from "./TextInput";
import Popover from "./Popover";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "next-i18next";
import Icon from "./Icon";
import { IconWeight } from "@phosphor-icons/react";

type Props = {
  alignment?: "left" | "right";
  color: string;
  setColor: Function;
  iconName?: string;
  setIconName: Function;
  weight: "light" | "regular" | "bold" | "fill" | "duotone" | "thin";
  setWeight: Function;
  reset: Function;
  className?: string;
};

const IconPicker = ({
  alignment,
  color,
  setColor,
  iconName,
  setIconName,
  weight,
  setWeight,
  className,
  reset,
}: Props) => {
  const fuse = new Fuse(icons, {
    keys: [{ name: "name", weight: 4 }, "tags", "categories"],
    threshold: 0.2,
    useExtendedSearch: true,
  });

  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [iconPicker, setIconPicker] = useState(false);

  const filteredQueryResultsSelector = useMemo(() => {
    if (!query) {
      return icons;
    }
    return fuse.search(query).map((result) => result.item);
  }, [query]);

  return (
    <div className="relative">
      <div
        onClick={() => setIconPicker(!iconPicker)}
        className="btn btn-square w-20 h-20"
      >
        {iconName ? (
          <Icon
            icon={iconName}
            size={60}
            weight={(weight || "regular") as IconWeight}
            color={color || "#0ea5e9"}
          />
        ) : (
          <i
            className="bi-folder-fill text-6xl"
            style={{ color: color || "#0ea5e9" }}
          ></i>
        )}
      </div>
      {iconPicker && (
        <Popover
          onClose={() => setIconPicker(false)}
          className={
            className +
            " fade-in bg-base-200 border border-neutral-content p-2 h-44 w-[22.5rem] rounded-lg backdrop-blur-sm bg-opacity-90 top-20 left-0 lg:-translate-x-1/3"
          }
        >
          <div className="flex gap-2 h-full w-full">
            <div className="flex flex-col gap-2 h-full w-fit color-picker">
              <div
                className="btn btn-ghost btn-xs"
                onClick={reset as React.MouseEventHandler<HTMLDivElement>}
              >
                {t("reset")}
              </div>
              <select
                className="border border-neutral-content bg-base-100 focus:outline-none focus:border-primary duration-100 w-full rounded-md h-7"
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
              <HexColorPicker color={color} onChange={(e) => setColor(e)} />
            </div>

            <div className="flex flex-col gap-2 w-fit">
              <TextInput
                className="p-2 rounded w-full h-7 text-sm"
                placeholder="Search icons"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <div className="grid grid-cols-4 gap-1 w-full overflow-y-auto h-32 border border-neutral-content bg-base-100 rounded-md p-2">
                {filteredQueryResultsSelector.map((icon) => {
                  const IconComponent = icon.Icon;
                  return (
                    <div
                      key={icon.pascal_name}
                      onClick={() => setIconName(icon.pascal_name)}
                      className={`cursor-pointer btn p-1 box-border bg-base-100 border-none aspect-square ${
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
          </div>
        </Popover>
      )}
    </div>
  );
};

export default IconPicker;
