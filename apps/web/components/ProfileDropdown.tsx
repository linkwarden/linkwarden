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
import { Theme } from "@linkwarden/prisma/client";

const themeOrder: Theme[] = ["light", "dark", "auto"];

export default function ProfileDropdown() {
  const { t } = useTranslation();
  const updateUserPreference = useUpdateUserPreference();
  const { data: user } = useUser();

  const { data: config } = useConfig();

  const isAdmin = user?.id === (config?.ADMIN || 1);

  const handleCycleTheme = () => {
    const currentIndex = themeOrder.indexOf(user?.theme || "dark");
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    updateUserPreference.mutate({ theme: nextTheme });
  };

  const getNextThemeLabel = () => {
    const currentIndex = themeOrder.indexOf(user?.theme || "dark");
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    const nextTheme = themeOrder[nextIndex];
    return t(nextTheme);
  };

  const getIcon = () => {
    switch (user?.theme) {
      case "light":
        return "bi-sun-fill";
      case "dark":
        return "bi-moon-fill";
      case "auto":
        return "bi-circle-half";
      default:
        return "bi-moon-fill";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" className="rounded-full p-1">
          <ProfilePhoto
            src={user?.image ? user?.image : undefined}
            priority={true}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem asChild>
          <Link href="/settings/account" className="whitespace-nowrap">
            <i className="bi-gear"></i>
            {t("settings")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <div
            onClick={() => handleCycleTheme()}
            className="whitespace-nowrap block sm:hidden"
          >
            <i className={getIcon()}></i>
            {t("switch_to", {
              theme: getNextThemeLabel(),
            })}
          </div>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin/user-administration"
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
