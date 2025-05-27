import useLocalSettingsStore from "@/store/localSettings";
import { useEffect, useState, ChangeEvent } from "react";
import { useTranslation } from "next-i18next";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  className?: string;
  align?: "left" | "right" | "top" | "bottom";
};

export default function ToggleDarkMode({ className, align }: Props) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useLocalSettingsStore();

  const [theme, setTheme] = useState<string | null>(
    localStorage.getItem("theme")
  );

  const handleToggle = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.checked ? "dark" : "light");
  };

  useEffect(() => {
    if (theme) {
      updateSettings({ theme });
    }
  }, [theme]);

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
                checked={theme === "dark"}
              />
              <i className="bi-sun-fill text-xl swap-on"></i>
              <i className="bi-moon-fill text-xl swap-off"></i>
            </label>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={align || "bottom"}>
          <p>
            {t("switch_to", {
              theme: settings.theme === "light" ? "Dark" : "Light",
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
