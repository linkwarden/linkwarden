import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export default function ToggleDarkMode() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <div
      className="flex gap-1 group sm:hover:bg-slate-200 sm:hover:dark:bg-slate-800 sm:hover:p-1 sm:hover:pr-2 duration-100 h-10 rounded-full items-center w-fit cursor-pointer"
      onClick={handleToggle}
    >
      <div className="shadow bg-sky-700 dark:bg-sky-400 flex items-center justify-center rounded-full text-white w-10 h-10 sm:group-hover:w-8 sm:group-hover:h-8 duration-100 border-[3px] border-slate-200 dark:border-blue-900">
        <FontAwesomeIcon
          icon={theme === "dark" ? faSun : faMoon}
          className="w-1/2 h-1/2"
        />
      </div>
    </div>
  );
}
