import SettingsLayout from "@/layouts/SettingsLayout";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

export default function Appearance() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsLayout>
      <p className="mb-3">Select Theme</p>
      <div className="flex gap-3 w-full">
        <div
          className={`w-full text-center outline-solid outline-sky-100 outline dark:outline-neutral-700 h-40 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none bg-black ${
            theme === "dark"
              ? "dark:outline-sky-500 text-sky-500"
              : "text-white"
          }`}
          onClick={() => setTheme("dark")}
        >
          <FontAwesomeIcon icon={faMoon} className="w-1/2 h-1/2" />
          <p className="text-2xl">Dark Theme</p>

          {/* <hr className="my-3 outline-1 outline-sky-100 dark:outline-neutral-700" /> */}
        </div>
        <div
          className={`w-full text-center outline-solid outline-sky-100 outline dark:outline-neutral-700 h-40 duration-100 rounded-md flex items-center justify-center cursor-pointer select-none bg-white ${
            theme === "light" ? "outline-sky-500 text-sky-500" : "text-black"
          }`}
          onClick={() => setTheme("light")}
        >
          <FontAwesomeIcon icon={faSun} className="w-1/2 h-1/2" />
          <p className="text-2xl">Light Theme</p>
          {/* <hr className="my-3 outline-1 outline-sky-100 dark:outline-neutral-700" /> */}
        </div>
      </div>
    </SettingsLayout>
  );
}
