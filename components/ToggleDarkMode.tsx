import useLocalSettingsStore from "@/store/localSettings";
import { useEffect, useState, ChangeEvent } from "react";
import { useTranslation } from "next-i18next";

type Props = {
  className?: string;
};

export default function ToggleDarkMode({ className }: Props) {
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
      localStorage.setItem("theme", theme);
    }
  }, [theme, updateSettings]);

  return (
    <div
      className="tooltip tooltip-bottom"
      data-tip={t("switch_to", {
        theme: settings.theme === "light" ? "Dark" : "Light",
      })}
    >
      <label
        className={`swap swap-rotate btn-square text-neutral btn btn-ghost btn-sm ${className}`}
      >
        <input
          type="checkbox"
          onChange={handleToggle}
          className="theme-controller"
          checked={theme === "dark"}
        />
        <i className="bi-sun-fill text-xl swap-on"></i>
        <i className="bi-moon-fill text-xl swap-off"></i>
      </label>
    </div>
  );
}
