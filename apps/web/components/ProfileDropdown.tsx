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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProfileDropdown({
  showName,
  tooltipSide,
  dropdownSide,
  dropdownAlign,
}: {
  showName?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  dropdownSide?: "top" | "right" | "bottom" | "left";
  dropdownAlign?: "center" | "start" | "end";
}) {
  const { t } = useTranslation();
  const updateUserPreference = useUpdateUserPreference();
  const { data: user } = useUser();
  const LINKWARDEN_VERSION = process.env.version;

  const { data: config } = useConfig();

  const isAdmin = user?.id === (config?.ADMIN || 1);

  const themeOptions = [
    { value: "auto", label: t("system"), icon: "bi-circle-half" },
    { value: "dark", label: t("dark"), icon: "bi-moon-fill" },
    { value: "light", label: t("light"), icon: "bi-sun-fill" },
  ] as const;

  const trigger = (
    <DropdownMenuTrigger>
      {showName ? (
        <div className="flex items-center gap-2 rounded-full h-10 px-0 justify-start min-w-0 w-fit">
          <ProfilePhoto
            src={user?.image ? user?.image : undefined}
            name={user?.name}
            priority={true}
          />
          <span className="truncate text-sm max-w-48">
            {user?.name || user?.username}
          </span>
        </div>
      ) : (
        <Button variant="ghost" className="rounded-full p-1">
          <ProfilePhoto
            src={user?.image ? user?.image : undefined}
            name={user?.name}
            priority={true}
          />
        </Button>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {tooltipSide ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side={tooltipSide} className="max-w-40 truncate">
              {t("account")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        trigger
      )}
      <DropdownMenuContent
        align={dropdownAlign || "start"}
        side={dropdownSide}
        className="min-w-40"
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          <ProfilePhoto
            src={user?.image ? user?.image : undefined}
            name={user?.name}
          />
          <div className="max-w-48 min-w-28">
            <p className="text-sm font-semibold truncate">
              {user?.name || user?.username}
            </p>
            <p className="text-xs text-neutral truncate">
              {user?.email || user?.username}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings/account" className="whitespace-nowrap">
            <i className="bi-gear"></i>
            {t("settings")}
          </Link>
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

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <i
              className={
                themeOptions.find((option) => option.value === user?.theme)
                  ?.icon || "bi-circle-half"
              }
            ></i>
            {t("theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() =>
                    updateUserPreference.mutate({ theme: option.value })
                  }
                >
                  <i className={option.icon}></i>
                  {option.label}
                  {user?.theme === option.value && (
                    <i className="bi-check2 ml-auto"></i>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <i className="bi-question-circle"></i>
            {t("need_help")}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem asChild>
                <Link
                  href="https://docs.linkwarden.app"
                  target="_blank"
                  className="whitespace-nowrap"
                >
                  <i className="bi-book"></i>
                  {t("documentation")}
                </Link>
              </DropdownMenuItem>
              {config?.STRIPE_ENABLED && (
                <DropdownMenuItem asChild>
                  <Link
                    href="mailto:support@linkwarden.app"
                    className="whitespace-nowrap"
                  >
                    <i className="bi-envelope"></i>
                    {t("contact_support")}
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuItem asChild>
          <div onClick={() => signOut()} className="whitespace-nowrap">
            <i className="bi-box-arrow-left" />
            {t("logout")}
          </div>
        </DropdownMenuItem>

        <Link
          href="https://github.com/linkwarden/linkwarden/releases"
          target="_blank"
          className="block px-2 py-1.5 text-xs text-neutral hover:opacity-50 duration-100"
        >
          {t("linkwarden_version", { version: LINKWARDEN_VERSION })}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
