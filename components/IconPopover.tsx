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
        "fade-in bg-base-200 border border-neutral-content p-2 w-[22.5rem] rounded-lg shadow-md"
      )}
    >
      <div className="flex gap-2 h-full w-full">
        <div className="flex flex-col gap-2 w-full">
          <TextInput
            className="p-2 rounded w-full h-7 text-sm"
            placeholder={t("search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="grid grid-cols-6 gap-1 w-full overflow-y-auto h-44 border border-neutral-content bg-base-100 rounded-md p-2">
            <IconGrid
              query={query}
              color={color}
              weight={weight}
              iconName={iconName}
              setIconName={setIconName}
            />
          </div>

          <div className="flex gap-2 color-picker w-full">
            <HexColorPicker color={color} onChange={(e) => setColor(e)} />

            <div className="grid grid-cols-2 gap-1 text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mr-2"
                  value="regular"
                  checked={weight === "regular"}
                  onChange={() => setWeight("regular")}
                />
                {t("regular")}
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mr-2"
                  value="thin"
                  checked={weight === "thin"}
                  onChange={() => setWeight("thin")}
                />
                {t("thin")}
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mr-2"
                  value="light"
                  checked={weight === "light"}
                  onChange={() => setWeight("light")}
                />
                {t("light_icon")}
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mr-2"
                  value="bold"
                  checked={weight === "bold"}
                  onChange={() => setWeight("bold")}
                />
                {t("bold")}
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mr-2"
                  value="fill"
                  checked={weight === "fill"}
                  onChange={() => setWeight("fill")}
                />
                {t("fill")}
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-primary mr-2"
                  value="duotone"
                  checked={weight === "duotone"}
                  onChange={() => setWeight("duotone")}
                />
                {t("duotone")}
              </label>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 justify-between items-center mt-2">
            <p className="text-neutral text-sm">{t("close_to_apply")}</p>
            <div
              className="btn btn-ghost btn-sm w-fit"
              onClick={reset as React.MouseEventHandler<HTMLDivElement>}
            >
              {t("reset_defaults")}
            </div>
          </div>
        </div>
      </div>
    </Popover>
  );
};

export default IconPopover;
