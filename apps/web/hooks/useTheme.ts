import { useEffect, useState } from "react";
import { useUser } from "@linkwarden/router/user";

export default function useTheme() {
  const { data: user } = useUser();

  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(media.matches ? "dark" : "light");

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const theme = user?.theme === "auto" ? systemTheme : user?.theme;

  useEffect(() => {
    if (theme)
      document.querySelector("html")?.setAttribute("data-theme", theme);
  }, [theme]);

  return theme as "dark" | "light" | undefined;
}
