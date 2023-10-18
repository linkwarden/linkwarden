import SettingsLayout from "@/layouts/SettingsLayout";
import { useTheme } from "next-themes";

export default function appearance() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <SettingsLayout>
      <div className="flex gap-3 w-full">
        <div
          className="w-full text-center border-solid border-sky-100 border dark:border-neutral-700 h-40 rounded-md flex items-center justify-center cursor-pointer select-none bg-black text-white"
          onClick={() => setTheme("dark")}
        >
          <p>Dark Theme</p>

          {/* <hr className="my-3 border-1 border-sky-100 dark:border-neutral-700" /> */}
        </div>
        <div
          className="w-full text-center border-solid border-sky-100 border dark:border-neutral-700 h-40 rounded-md flex items-center justify-center cursor-pointer select-none bg-white text-black"
          onClick={() => setTheme("light")}
        >
          <p>Light Theme</p>
          {/* <hr className="my-3 border-1 border-sky-100 dark:border-neutral-700" /> */}
        </div>
      </div>
    </SettingsLayout>
  );
}
