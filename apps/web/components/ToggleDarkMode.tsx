import { ChangeEvent } from "react";
import { useTranslation } from "next-i18next";
import { Button } from "./ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";

type Props = {
  className?: string;
  align?: "left" | "right" | "top" | "bottom";
};

export default function ToggleDarkMode({ className, align }: Props) {
  const { t } = useTranslation();
  const { data } = useUser();
  const updateUserPreference = useUpdateUserPreference();

  const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
    updateUserPreference.mutateAsync({
      theme: e.target.checked ? "dark" : "light",
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className={`inline-grid swap swap-rotate text-neutral ${
              className || ""
            }`}
          >
            <label>
              <input
                type="checkbox"
                onChange={handleToggle}
                className="theme-controller"
                checked={data?.theme === "dark"}
              />
              <i className="bi-sun-fill text-xl swap-on"></i>
              <i className="bi-moon-fill text-xl swap-off"></i>
            </label>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={align || "bottom"}>
          <p>
            {t("switch_to", {
              theme: data?.theme === "light" ? "Dark" : "Light",
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
