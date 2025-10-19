import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import SidebarHighlightLink from "@/components/SidebarHighlightLink";
import CollectionListing from "@/components/CollectionListing";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import { TagListing } from "./TagListing";
import { Button } from "./ui/button";
import { useUser } from "@linkwarden/router/user";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function Sidebar({
  className,
  toggleSidebar,
  sidebarIsCollapsed,
}: {
  className?: string;
  toggleSidebar?: () => void;
  sidebarIsCollapsed?: boolean;
}) {
  const { t } = useTranslation();
  const [tagDisclosure, setTagDisclosure] = useState<boolean>(() => {
    const storedValue = localStorage.getItem("tagDisclosure");
    return storedValue ? storedValue === "true" : true;
  });

  const [collectionDisclosure, setCollectionDisclosure] = useState<boolean>(
    () => {
      const storedValue = localStorage.getItem("collectionDisclosure");
      return storedValue ? storedValue === "true" : true;
    }
  );

  const { data: collections } = useCollections();

  const { data: tags = [], isLoading } = useTags();
  const [active, setActive] = useState("");

  const router = useRouter();

  const { data: user } = useUser();

  useEffect(() => {
    localStorage.setItem("tagDisclosure", tagDisclosure ? "true" : "false");
  }, [tagDisclosure]);

  useEffect(() => {
    localStorage.setItem(
      "collectionDisclosure",
      collectionDisclosure ? "true" : "false"
    );
  }, [collectionDisclosure]);

  useEffect(() => {
    setActive(router.asPath);
  }, [router, collections]);

  return (
    <div
      id="sidebar"
      className={cn(
        "bg-base-200 h-screen overflow-y-auto border-solid border border-base-200 border-r-neutral-content p-2 z-20",
        className,
        sidebarIsCollapsed ? "w-14" : "w-80"
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          sidebarIsCollapsed
            ? "my-auto h-full justify-between items-center gap-3"
            : "gap-1"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {sidebarIsCollapsed ? (
            <Image
              src={"/icon.png"}
              width={640}
              height={136}
              alt="Linkwarden Icon"
              className="h-8 w-auto cursor-pointer"
              onClick={() => router.push("/dashboard")}
            />
          ) : user?.theme === "light" ? (
            <Image
              src={"/linkwarden_light.png"}
              width={640}
              height={136}
              alt="Linkwarden"
              className="h-9 w-auto cursor-pointer"
              onClick={() => router.push("/dashboard")}
            />
          ) : (
            <Image
              src={"/linkwarden_dark.png"}
              width={640}
              height={136}
              alt="Linkwarden"
              className="h-9 w-auto cursor-pointer"
              onClick={() => router.push("/dashboard")}
            />
          )}

          {!sidebarIsCollapsed && (
            <div className="hidden lg:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={toggleSidebar}
                      size={"icon"}
                      aria-label={t("shrink_sidebar")}
                    >
                      <i className={`bi-layout-sidebar`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {sidebarIsCollapsed
                      ? t("expand_sidebar")
                      : t("shrink_sidebar")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex flex-col",
            sidebarIsCollapsed ? "my-auto justify-center gap-3" : "gap-1"
          )}
        >
          <SidebarHighlightLink
            title={t("dashboard")}
            href={`/dashboard`}
            icon={"bi-house"}
            active={active === `/dashboard`}
            sidebarIsCollapsed={sidebarIsCollapsed}
          />
          <SidebarHighlightLink
            title={t("links")}
            href={`/links`}
            icon={"bi-link-45deg"}
            active={active === `/links`}
            sidebarIsCollapsed={sidebarIsCollapsed}
          />
          <SidebarHighlightLink
            title={t("pinned")}
            href={`/links/pinned`}
            icon={"bi-pin-angle"}
            active={active === `/links/pinned`}
            sidebarIsCollapsed={sidebarIsCollapsed}
          />
          <SidebarHighlightLink
            title={t("collections")}
            href={`/collections`}
            icon={"bi-folder"}
            active={active === `/collections`}
            sidebarIsCollapsed={sidebarIsCollapsed}
          />
          <SidebarHighlightLink
            title={t("tags")}
            href={`/tags`}
            icon={"bi-hash"}
            active={active === `/tags`}
            sidebarIsCollapsed={sidebarIsCollapsed}
          />
        </div>

        {sidebarIsCollapsed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={toggleSidebar}
                  size={"icon"}
                  aria-label={t("expand_sidebar")}
                >
                  <i className={`bi-layout-sidebar`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {sidebarIsCollapsed ? t("expand_sidebar") : t("shrink_sidebar")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {sidebarIsCollapsed ? (
        <></>
      ) : (
        <>
          <Disclosure defaultOpen={collectionDisclosure}>
            <Disclosure.Button
              onClick={() => {
                setCollectionDisclosure(!collectionDisclosure);
              }}
              className="flex items-center justify-between w-full text-left mb-2 pl-2 font-bold text-neutral mt-5"
            >
              <p className="text-sm">{t("collections")}</p>
              <i
                className={`bi-chevron-down ${
                  collectionDisclosure ? "rotate-reverse" : "rotate"
                }`}
              ></i>
            </Disclosure.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform opacity-0 -translate-y-3"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition duration-100 ease-out"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-3"
            >
              <Disclosure.Panel>
                <CollectionListing />
              </Disclosure.Panel>
            </Transition>
          </Disclosure>
          <Disclosure defaultOpen={tagDisclosure}>
            <Disclosure.Button
              onClick={() => {
                setTagDisclosure(!tagDisclosure);
              }}
              className="flex items-center justify-between w-full text-left mb-2 pl-2 font-bold text-neutral mt-5"
            >
              <p className="text-sm">{t("tags")}</p>
              <i
                className={`bi-chevron-down  ${
                  tagDisclosure ? "rotate-reverse" : "rotate"
                }`}
              ></i>
            </Disclosure.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform opacity-0 -translate-y-3"
              enterTo="transform opacity-100 translate-y-0"
              leave="transition duration-100 ease-out"
              leaveFrom="transform opacity-100 translate-y-0"
              leaveTo="transform opacity-0 -translate-y-3"
            >
              <Disclosure.Panel className="flex flex-col gap-1">
                {isLoading ? (
                  <div className="flex flex-col gap-4">
                    <div className="skeleton h-4 w-full"></div>
                    <div className="skeleton h-4 w-full"></div>
                    <div className="skeleton h-4 w-full"></div>
                  </div>
                ) : (
                  <TagListing tags={tags} active={active} />
                )}
              </Disclosure.Panel>
            </Transition>
          </Disclosure>
        </>
      )}
    </div>
  );
}
