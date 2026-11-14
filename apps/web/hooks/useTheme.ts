import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useUser } from "@linkwarden/router/user";

type Theme = "dark" | "light";
type SessionStatus = "authenticated" | "loading" | "unauthenticated";

// Visitors without an account (public collections, public preserved pages,
// login) have no theme preference stored, so they follow the OS setting.
export function resolveDisplayTheme(
  status: SessionStatus,
  userTheme: string | null | undefined,
  systemTheme: Theme
): Theme | undefined {
  if (status === "unauthenticated" || userTheme === "auto") return systemTheme;
  return (userTheme as Theme) || undefined;
}

export default function useTheme() {
  const { status } = useSession();
  const { data: user } = useUser();

  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
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

  const theme = resolveDisplayTheme(status, user?.theme, systemTheme);

  useEffect(() => {
    if (theme)
      document.querySelector("html")?.setAttribute("data-theme", theme);
  }, [theme]);

  return theme;
}
