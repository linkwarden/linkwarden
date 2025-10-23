import React from "react";
import { useTranslation } from "next-i18next";
import { Button } from "./ui/button";
import Icon from "./Icon";
import { IconWeight } from "@phosphor-icons/react";
import IconPopover from "./IconPopover";

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
};

const IconPicker = ({
  color,
  setColor,
  iconName,
  setIconName,
  weight,
  setWeight,
  reset,
  hideDefaultIcon,
}: Props) => {
  const { t } = useTranslation();

  return (
    <IconPopover
      color={color}
      setColor={setColor}
      iconName={iconName}
      setIconName={setIconName}
      weight={weight}
      setWeight={setWeight}
      reset={reset}
    >
      <Button variant="ghost" className="size-20">
        {iconName ? (
          <Icon
            icon={iconName}
            size={60}
            weight={(weight || "regular") as IconWeight}
            color={color}
          />
        ) : !iconName && hideDefaultIcon ? (
          <p className="p-1">{t("set_custom_icon")}</p>
        ) : (
          <i className="bi-folder-fill text-6xl" style={{ color: color }}></i>
        )}
      </Button>
    </IconPopover>
  );
};

export default IconPicker;
