import React, { useState } from "react";
import TextInput from "./TextInput";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "next-i18next";
import IconGrid from "./IconGrid";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
  hideDefaultIcon?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Trigger element for the popover
   */
  children: React.ReactNode;
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
  children,
  open,
  onOpenChange,
}: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[22.5rem]" disablePortal>
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

        <div className="flex gap-3 color-picker w-full justify-between">
          <HexColorPicker
            color={color}
            onChange={(e) => setColor(e)}
            className="border border-neutral-content rounded-lg"
          />

          <div className="grid grid-cols-2 gap-3 text-sm">
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
        <div className="flex flex-row gap-2 justify-between items-center mt-2">
          <Button size="sm" variant="ghost" onClick={() => reset()}>
            <i className="bi-arrow-counterclockwise text-neutral" />
            {t("reset_defaults")}
          </Button>
          <p className="text-neutral text-xs">{t("click_out_to_apply")}</p>
        </div>
        {/* </div> */}
      </PopoverContent>
    </Popover>
  );
};

export default IconPopover;
