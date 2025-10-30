import { useTranslation } from "next-i18next";
import { Button } from "./ui/button";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";
import { cn } from "@/lib/utils";

export default function ToggleDarkMode() {
  const { t } = useTranslation();
  const { data } = useUser();
  const updateUserPreference = useUpdateUserPreference();

  const handleToggle = () => {
    updateUserPreference.mutateAsync({
      theme: data?.theme === "light" ? "dark" : "light",
    });
  };

  if (!data?.theme) return <></>;

  const isDarkMode = data.theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "inline-grid swap swap-rotate text-neutral",
        isDarkMode && "swap-active"
      )}
      aria-label={t("switch_to", {
        theme: data?.theme === "light" ? "Dark" : "Light",
      })}
      onClick={handleToggle}
      title={t("switch_to", {
        theme: data?.theme === "light" ? "Dark" : "Light",
      })}
    >
      <i className="bi-sun-fill text-xl swap-on" />
      <i className="bi-moon-fill text-xl swap-off" />
    </Button>
  );
}
