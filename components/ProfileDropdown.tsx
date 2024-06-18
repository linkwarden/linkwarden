import useLocalSettingsStore from "@/store/localSettings";
import { dropdownTriggerer } from "@/lib/client/utils";
import ProfilePhoto from "./ProfilePhoto";
import useAccountStore from "@/store/account";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTranslation } from "next-i18next";

export default function ProfileDropdown() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useLocalSettingsStore();
  const { account } = useAccountStore();

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
          src={account.image ? account.image : undefined}
          priority={true}
        />
      </div>
      <ul className="dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box w-40 mt-1">
        <li>
          <Link
            href="/settings/account"
            onClick={() => (document?.activeElement as HTMLElement)?.blur()}
            tabIndex={0}
            role="button"
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
          >
            {t("switch_to", {
              theme: settings.theme === "light" ? t("dark") : t("light"),
            })}
          </div>
        </li>
        <li>
          <div
            onClick={() => {
              (document?.activeElement as HTMLElement)?.blur();
              signOut();
            }}
            tabIndex={0}
            role="button"
          >
            {t("logout")}
          </div>
        </li>
      </ul>
    </div>
  );
}
