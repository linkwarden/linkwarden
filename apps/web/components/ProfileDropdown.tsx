import useLocalSettingsStore from "@/store/localSettings";
import ProfilePhoto from "./ProfilePhoto";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";
import { useConfig } from "@linkwarden/router/config";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

export default function ProfileDropdown() {
  const { t } = useTranslation();
  const { settings } = useLocalSettingsStore();
  const updateUserPreference = useUpdateUserPreference();
  const { data: user } = useUser();

  const { data: config } = useConfig();

  const isAdmin = user?.id === (config?.ADMIN || 1);

  const handleToggle = () => {
    const newTheme = user?.theme === "dark" ? "light" : "dark";
    updateUserPreference.mutate({ theme: newTheme });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="rounded-full p-1"
          aria-label={t("user_menu")}
        >
          <ProfilePhoto
            src={user?.image ? user?.image : undefined}
            priority={true}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/settings/account" className="whitespace-nowrap">
            <i className="bi-gear"></i>
            {t("settings")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <div
            onClick={() => handleToggle()}
            className="whitespace-nowrap block sm:hidden"
          >
            {user?.theme === "light" ? (
              <i className="bi-moon-fill"></i>
            ) : (
              <i className="bi-sun-fill"></i>
            )}
            {t("switch_to", {
              theme: user?.theme === "light" ? t("dark") : t("light"),
            })}
          </div>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              onClick={() => (document?.activeElement as HTMLElement)?.blur()}
              className="whitespace-nowrap"
            >
              <i className="bi-hdd-stack"></i>
              {t("server_administration")}
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem asChild>
          <div onClick={() => signOut()} className="whitespace-nowrap">
            <i className="bi-box-arrow-left" />
            {t("logout")}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
