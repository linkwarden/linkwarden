import useLocalSettingsStore from "@/store/localSettings";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
};

export default function ToggleDarkMode({ className }: Props) {
  const { settings, updateSettings } = useLocalSettingsStore();

  const [theme, setTheme] = useState(localStorage.getItem("theme"));

  const handleToggle = (e: any) => {
    setTheme(e.target.checked ? "dark" : "light");
  };

  useEffect(() => {
    updateSettings({ theme: theme as string });
  }, [theme]);

  return (
    <div
      className="tooltip tooltip-bottom"
      data-tip={`Switch to ${settings.theme === "light" ? "Dark" : "Light"}`}
    >
      <label
        className={`swap swap-rotate btn-square text-neutral btn btn-ghost btn-sm ${className}`}
      >
        <input
          type="checkbox"
          onChange={handleToggle}
          className="theme-controller"
          checked={localStorage.getItem("theme") === "light" ? false : true}
        />
        <i className="bi-sun-fill text-xl swap-on"></i>
        <i className="bi-moon-fill text-xl swap-off"></i>
      </label>
    </div>
  );
}
