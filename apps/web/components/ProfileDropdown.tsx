import useLocalSettingsStore from "@/store/localSettings";
import { dropdownTriggerer } from "@/lib/client/utils";
import ProfilePhoto from "./ProfilePhoto";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";
import { useConfig } from "@/hooks/store/config";

export default function ProfileDropdown() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useLocalSettingsStore();
  const { data: user = {} } = useUser();

  const { data: config } = useConfig();

  const isAdmin = user.id === (config?.ADMIN || 1);

  const handleToggle = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark";
    updateSettings({ theme: newTheme });
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        onMouseDown={dropdownTriggerer}
        className="btn btn-circle btn-ghost"
      >
        <ProfilePhoto
          src={user.image ? user.image : undefined}
          priority={true}
        />
      </div>
      <ul
        className={`dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box mt-1`}
      >
        <li>
          <Link
            href="/settings/account"
            onClick={() => (document?.activeElement as HTMLElement)?.blur()}
            tabIndex={0}
            role="button"
            className="whitespace-nowrap"
          >
            {t("settings")}
          </Link>
        </li>
        <li className="block sm:hidden">
          <div
            onClick={() => {
              (document?.activeElement as HTMLElement)?.blur();
              handleToggle();
            }}
            tabIndex={0}
            role="button"
            className="whitespace-nowrap"
          >
            {t("switch_to", {
              theme: settings.theme === "light" ? t("dark") : t("light"),
            })}
          </div>
        </li>
        {isAdmin && (
          <li>
            <Link
              href="/admin"
              onClick={() => (document?.activeElement as HTMLElement)?.blur()}
              tabIndex={0}
              role="button"
              className="whitespace-nowrap"
            >
              {t("server_administration")}
            </Link>
          </li>
        )}
        <li>
          <div
            onClick={() => {
              (document?.activeElement as HTMLElement)?.blur();
              signOut();
            }}
            tabIndex={0}
            role="button"
            className="whitespace-nowrap"
          >
            {t("logout")}
          </div>
        </li>
      </ul>
    </div>
  );
}
