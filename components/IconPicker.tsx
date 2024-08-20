import React, { useState } from "react";
import TextInput from "./TextInput";
import Popover from "./Popover";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "next-i18next";
import Icon from "./Icon";
import { IconWeight } from "@phosphor-icons/react";
import IconGrid from "./IconGrid";

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
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [iconPicker, setIconPicker] = useState(false);

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
                <option value="regular">{t("regular")}</option>
                <option value="thin">{t("thin")}</option>
                <option value="light">{t("light_icon")}</option>
                <option value="bold">{t("bold")}</option>
                <option value="fill">{t("fill")}</option>
                <option value="duotone">{t("duotone")}</option>
              </select>
              <HexColorPicker color={color} onChange={(e) => setColor(e)} />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <TextInput
                className="p-2 rounded w-full h-7 text-sm"
                placeholder={t("search")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <div className="grid grid-cols-4 gap-1 w-full overflow-y-auto h-32 border border-neutral-content bg-base-100 rounded-md p-2">
                <IconGrid
                  query={query}
                  color={color}
                  weight={weight}
                  iconName={iconName}
                  setIconName={setIconName}
                />
              </div>
            </div>
          </div>
        </Popover>
      )}
    </div>
  );
};

export default IconPicker;
