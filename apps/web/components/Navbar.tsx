import { useEffect, useState } from "react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/router";
import SearchBar from "@/components/SearchBar";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import ToggleDarkMode from "./ToggleDarkMode";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import UploadFileModal from "./ModalContent/UploadFileModal";
import MobileNavigation from "./MobileNavigation";
import ProfileDropdown from "./ProfileDropdown";
import { useTranslation } from "next-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUser } from "@linkwarden/router/user";
import Link from "next/link";

const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE === "true";
const TRIAL_PERIOD_DAYS =
  Number(process.env.NEXT_PUBLIC_TRIAL_PERIOD_DAYS) || 14;

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: user } = useUser();

  const [sidebar, setSidebar] = useState(false);

  const { width } = useWindowDimensions();

  useEffect(() => {
    if (sidebar) setSidebar(false);
  }, [width, router]);

  useEffect(() => {
    document.body.style.overflow = "auto";
  }, [sidebar]);

  const toggleSidebar = () => {
    setSidebar(false);
    document.body.style.overflow = "auto";
  };

  const [newLinkModal, setNewLinkModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [uploadFileModal, setUploadFileModal] = useState(false);

  const [daysLeft, setDaysLeft] = useState<number>(0);
  const [isTrialling, setIsTrialling] = useState<boolean>(false);

  useEffect(() => {
    if (user?.createdAt) {
      const trialEndTime =
        new Date(user.createdAt).getTime() +
        (1 + Number(TRIAL_PERIOD_DAYS)) * 86400000; // Add 1 to account for the current day

      setDaysLeft(Math.floor((trialEndTime - Date.now()) / 86400000));
    }
  }, [user]);

  useEffect(() => {
    const isTrialling =
      user?.id &&
      !user?.subscription?.active &&
      !user.parentSubscription?.active;

    setIsTrialling(Boolean(isTrialling));
  }, [user, daysLeft]);

  return (
    <>
      {STRIPE_ENABLED && isTrialling && (
        <Link
          href="/subscribe"
          className="w-full text-sm cursor-pointer select-none bg-base-200"
        >
          <p className="w-full text-center flex items-center justify-center gap-1 underline decoration-dotted underline-offset-4 hover:opacity-70 duration-200 py-1 px-2">
            <i className="bi-clock text-primary" />
            {daysLeft === 1
              ? t("trial_left_singular")
              : t("trial_left_plural", { count: daysLeft })}
          </p>
        </Link>
      )}
      <div className="flex justify-between gap-2 items-center pl-3 pr-4 py-2 border-solid border-b-neutral-content border-b">
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral lg:hidden sm:inline-flex"
          onClick={() => {
            setSidebar(true);
            document.body.style.overflow = "hidden";
          }}
        >
          <i className="bi-list text-xl leading-none" />
        </Button>

        <SearchBar />

        <div className="flex items-center gap-2">
          <ToggleDarkMode hideInMobile />

          <DropdownMenu>
            <DropdownMenuTrigger className="hidden sm:inline-grid">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="accent"
                      size="sm"
                      className="min-w-[3.4rem] h-[2rem] relative"
                    >
                      <span>
                        <i className="bi-plus text-4xl absolute -top-[0.3rem] left-0 pointer-events-none" />
                      </span>
                      <span>
                        <i className="bi-caret-down-fill text-xs absolute top-[0.6rem] right-[0.4rem] pointer-events-none" />
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("create_new")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setNewLinkModal(true)}>
                <i className="bi-link-45deg" />
                {t("new_link")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setUploadFileModal(true)}>
                <i className="bi-file-earmark-arrow-up" />
                {t("upload_file")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setNewCollectionModal(true)}>
                <i className="bi-folder" />
                {t("new_collection")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ProfileDropdown />
        </div>

        <MobileNavigation />

        {sidebar && (
          <div className="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-40">
            <ClickAwayHandler className="h-full" onClickOutside={toggleSidebar}>
              <div className="slide-right h-full shadow-lg">
                <Sidebar />
              </div>
            </ClickAwayHandler>
          </div>
        )}
        {newLinkModal && (
          <NewLinkModal onClose={() => setNewLinkModal(false)} />
        )}
        {newCollectionModal && (
          <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
        )}
        {uploadFileModal && (
          <UploadFileModal onClose={() => setUploadFileModal(false)} />
        )}
      </div>
    </>
  );
}
