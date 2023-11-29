import useLocalSettingsStore from "@/store/localSettings";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
};

export default function ToggleDarkMode({ className }: Props) {
  const { settings, updateSettings } = useLocalSettingsStore();

  const [theme, setTheme] = useState(localStorage.getItem("theme"));

  const handleToggle = (e: any) => {
    if (e.target.checked) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
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

        {/* sun icon */}

        <svg
          className="swap-on fill-current w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z" />
        </svg>

        {/* moon icon */}
        <svg
          className="swap-off fill-current w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278" />
        </svg>
      </label>
    </div>
  );
}
