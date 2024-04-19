import useLocalSettingsStore from "@/store/localSettings";
import { dropdownTriggerer } from "@/lib/client/utils";
import ProfilePhoto from "./ProfilePhoto";
import useAccountStore from "@/store/account";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function ProfileDropdown() {
  const { settings, updateSettings } = useLocalSettingsStore();
  const { account } = useAccountStore();

  const handleToggle = () => {
    if (settings.theme === "dark") {
      updateSettings({ theme: "light" });
    } else {
      updateSettings({ theme: "dark" });
    }
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
            Settings
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
            Switch to {settings.theme === "light" ? "Dark" : "Light"}
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
            Logout
          </div>
        </li>
      </ul>
    </div>
  );
}
