import React, { useState } from "react";
import TextInput from "./TextInput";
import Popover from "./Popover";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "next-i18next";
import IconGrid from "./IconGrid";
import clsx from "clsx";

type Props = {
  alignment?: string;
  color: string;
  setColor: Function;
  iconName?: string;
  setIconName: Function;
  weight: "light" | "regular" | "bold" | "fill" | "duotone" | "thin";
  setWeight: Function;
  reset: Function;
  className?: string;
  onClose: Function;
};

const IconPopover = ({
  alignment,
  color,
  setColor,
  iconName,
  setIconName,
  weight,
  setWeight,
  reset,
  className,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  return (
    <Popover
      onClose={() => onClose()}
      className={clsx(
        className,
        "fade-in bg-base-200 border border-neutral-content p-2 h-44 w-[22.5rem] rounded-lg"
      )}
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
  );
};

export default IconPopover;
