import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

type Props = {
  className?: string;
};

export default function ToggleDarkMode({ className }: Props) {
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
      className={`cursor-pointer flex select-none border border-sky-600 items-center justify-center dark:bg-neutral-900 bg-white hover:border-sky-500 group duration-100 rounded-full text-white w-10 h-10 ${className}`}
      onClick={handleToggle}
    >
      <FontAwesomeIcon
        icon={theme === "dark" ? faSun : faMoon}
        className="w-1/2 h-1/2 text-sky-600 group-hover:text-sky-500"
      />
    </div>
  );
}
