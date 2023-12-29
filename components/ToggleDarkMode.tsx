import useLocalSettingsStore from "@/store/localSettings";
import { useEffect, useState } from "react";

type Props = {
   className?: string;
};

export default function ToggleDarkMode({ className }: Props) {
   const { updateSettings } = useLocalSettingsStore();
   const [theme, setTheme] = useState('default-light');

   useEffect(() => {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
         setTheme(storedTheme);
      } else {
         // Default theme if not set in localStorage
         localStorage.setItem("theme", "default-light");
         setTheme("default-light");
      }
      console.log("Initial theme from localStorage:", storedTheme || "default-light");
   }, []);

   const handleToggle = () => {
      const [currentColorTheme, currentMode] = theme.split('-');
      const newMode = currentMode === 'light' ? 'dark' : 'light';
      const newTheme = `${currentColorTheme}-${newMode}`;

      setTheme(newTheme);
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      updateSettings({ theme: newTheme });
      console.log("New theme set:", newTheme);
   };

   const isDarkMode = theme.endsWith('-dark');

   return (
      <div className="tooltip tooltip-bottom" data-tip={`Switch to ${isDarkMode ? "Light" : "Dark"}`}>
         <label className={`swap swap-rotate btn-square text-neutral btn btn-ghost btn-sm ${className}`}>
            <input type="checkbox" onChange={handleToggle} className="theme-controller" checked={isDarkMode} />
            <i className="bi-sun-fill text-xl swap-on"></i>
            <i className="bi-moon-fill text-xl swap-off"></i>
         </label>
      </div>
   );
}
