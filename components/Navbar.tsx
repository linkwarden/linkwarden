import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { signOut } from "next-auth/react";
import { faPlus, faBars } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import Dropdown from "@/components/Dropdown";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";
import Search from "@/components/Search";
import useAccountStore from "@/store/account";
import ProfilePhoto from "@/components/ProfilePhoto";
import useModalStore from "@/store/modals";
import { useTheme } from "next-themes";
import useWindowDimensions from "@/hooks/useWindowDimensions";

export default function Navbar() {
  const { setModal } = useModalStore();

  const { account } = useAccountStore();

  const [profileDropdown, setProfileDropdown] = useState(false);

  const router = useRouter();

  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  const [sidebar, setSidebar] = useState(false);

  const { width } = useWindowDimensions();

  useEffect(() => {
    setSidebar(false);
  }, [width]);

  useEffect(() => {
    setSidebar(false);
  }, [router]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  return (
    <div className="flex justify-between gap-2 items-center px-5 py-2 border-solid border-b-sky-100 dark:border-b-neutral-700 border-b h-16">
      <div
        onClick={toggleSidebar}
        className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-[0.687rem] text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
      >
        <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
      </div>
      <Search />
      <div className="flex items-center gap-2">
        <div
          onClick={() => {
            setModal({
              modal: "LINK",
              state: true,
              method: "CREATE",
            });
          }}
          className="inline-flex gap-1 relative sm:w-[7.2rem] items-center font-semibold select-none cursor-pointer p-[0.687rem] sm:p-2 sm:px-3 rounded-md sm:rounded-full hover:bg-sky-100 dark:hover:bg-sky-800 sm:dark:hover:bg-sky-600 text-sky-500 sm:text-white sm:bg-sky-700 sm:hover:bg-sky-600 duration-100 group"
        >
          <FontAwesomeIcon
            icon={faPlus}
            className="w-5 h-5 sm:group-hover:ml-9 sm:absolute duration-100"
          />
          <span className="hidden sm:block group-hover:opacity-0 text-right w-full duration-100">
            New Link
          </span>
        </div>
        <div className="relative">
          <div
            className="flex gap-1 group sm:hover:bg-slate-200 sm:hover:dark:bg-neutral-700 sm:hover:p-1 sm:hover:pr-2 duration-100 h-10 rounded-full items-center w-fit cursor-pointer"
            onClick={() => setProfileDropdown(!profileDropdown)}
            id="profile-dropdown"
          >
            <ProfilePhoto
              src={account.image ? account.image : undefined}
              priority={true}
              className="sm:group-hover:h-8 sm:group-hover:w-8 duration-100 border-[3px]"
            />
            <p
              id="profile-dropdown"
              className="font-bold text-black dark:text-white leading-3 hidden sm:block select-none truncate max-w-[8rem] py-1"
            >
              {account.name}
            </p>
          </div>
          {profileDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Settings",
                  href: "/settings/account",
                },
                {
                  name: `Switch to ${theme === "light" ? "Dark" : "Light"}`,
                  onClick: () => {
                    handleToggle();
                    setProfileDropdown(!profileDropdown);
                  },
                },
                {
                  name: "Logout",
                  onClick: () => {
                    signOut();
                    setProfileDropdown(!profileDropdown);
                  },
                },
              ]}
              onClickOutside={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.id !== "profile-dropdown") setProfileDropdown(false);
              }}
              className="absolute top-11 right-0 z-20 w-36"
            />
          ) : null}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
              <ClickAwayHandler
                className="h-full"
                onClickOutside={toggleSidebar}
              >
                <div className="slide-right h-full shadow-lg">
                  <Sidebar />
                </div>
              </ClickAwayHandler>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
