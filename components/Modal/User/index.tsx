import { Tab } from "@headlessui/react";
import { AccountSettings } from "@/types/global";
import { useState } from "react";
import ChangePassword from "./ChangePassword";
import ProfileSettings from "./ProfileSettings";
import PrivacySettings from "./PrivacySettings";
import BillingPortal from "./BillingPortal";

type Props = {
  toggleSettingsModal: Function;
  activeUser: AccountSettings;
  className?: string;
  defaultIndex?: number;
};

const STRIPE_BILLING_PORTAL_URL =
  process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL;

export default function UserModal({
  className,
  defaultIndex,
  toggleSettingsModal,
  activeUser,
}: Props) {
  const [user, setUser] = useState<AccountSettings>(activeUser);

  console.log(activeUser);

  return (
    <div className={className}>
      <Tab.Group defaultIndex={defaultIndex}>
        <Tab.List className="flex justify-center flex-col max-w-[15rem] sm:max-w-[30rem] mx-auto sm:flex-row gap-2 sm:gap-3 mb-5 text-sky-600">
          <Tab
            className={({ selected }) =>
              selected
                ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
            }
          >
            Profile Settings
          </Tab>

          <Tab
            className={({ selected }) =>
              selected
                ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
            }
          >
            Privacy Settings
          </Tab>

          <Tab
            className={({ selected }) =>
              selected
                ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
            }
          >
            Password
          </Tab>

          {STRIPE_BILLING_PORTAL_URL ? (
            <Tab
              className={({ selected }) =>
                selected
                  ? "px-2 py-1 bg-sky-200 duration-100 rounded-md outline-none"
                  : "px-2 py-1 hover:bg-slate-200 rounded-md duration-100 outline-none"
              }
            >
              Billing Portal
            </Tab>
          ) : undefined}
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <ProfileSettings
              toggleSettingsModal={toggleSettingsModal}
              setUser={setUser}
              user={user}
            />
          </Tab.Panel>

          <Tab.Panel>
            <PrivacySettings
              toggleSettingsModal={toggleSettingsModal}
              setUser={setUser}
              user={user}
            />
          </Tab.Panel>

          <Tab.Panel>
            <ChangePassword
              togglePasswordFormModal={toggleSettingsModal}
              setUser={setUser}
              user={user}
            />
          </Tab.Panel>

          {STRIPE_BILLING_PORTAL_URL ? (
            <Tab.Panel>
              <BillingPortal />
            </Tab.Panel>
          ) : undefined}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
