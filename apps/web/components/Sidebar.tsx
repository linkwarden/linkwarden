import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import SidebarHighlightLink from "@/components/SidebarHighlightLink";
import CollectionListing from "@/components/CollectionListing";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import TagListing from "./TagListing";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TagSort } from "@linkwarden/types/global";
import { useInView } from "react-intersection-observer";
import SidebarShell, { ActionIcon } from "@/components/SidebarShell";
import SidebarScrollArea from "@/components/SidebarScrollArea";
import NewLinkModal from "./ModalContent/NewLinkModal";
import NewCollectionModal from "./ModalContent/NewCollectionModal";
import NewTagModal from "./ModalContent/NewTagModal";
import UploadFileModal from "./ModalContent/UploadFileModal";
import SearchModal, { isAppleDevice } from "./ModalContent/SearchModal";

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
  const { ref, inView } = useInView();
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

  const [searchModal, setSearchModal] = useState(false);
  const [newLinkModal, setNewLinkModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [newTagModal, setNewTagModal] = useState(false);
  const [uploadFileModal, setUploadFileModal] = useState(false);

  const { data: collections } = useCollections();

  const {
    data: tags = [],
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTags(undefined, {
    sort: TagSort.NameAZ,
  });
  const [active, setActive] = useState("");

  const router = useRouter();

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "k" &&
        (isAppleDevice ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
        setSearchModal((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;

    fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SidebarShell
      className={className}
      toggleSidebar={toggleSidebar}
      sidebarIsCollapsed={sidebarIsCollapsed}
    >
      {({ collapsed, toggle, closeMobileSidebar }) => {
        const openModal = (setModal: (value: boolean) => void) => {
          setModal(true);
          closeMobileSidebar();
        };

        const navLinks = (
          <div className={cn("flex flex-col gap-2", collapsed && "gap-3")}>
            <SidebarHighlightLink
              title={t("dashboard")}
              href={`/dashboard`}
              icon={"bi-house"}
              active={active === `/dashboard`}
              sidebarIsCollapsed={collapsed}
            />
            <SidebarHighlightLink
              title={t("links")}
              href={`/links`}
              icon={"bi-link-45deg"}
              active={active === `/links`}
              sidebarIsCollapsed={collapsed}
            />
            <SidebarHighlightLink
              title={t("pinned")}
              href={`/links/pinned`}
              icon={"bi-pin-angle"}
              active={active === `/links/pinned`}
              sidebarIsCollapsed={collapsed}
            />
            <SidebarHighlightLink
              title={t("collections")}
              href={`/collections`}
              icon={"bi-folder"}
              active={active === `/collections`}
              sidebarIsCollapsed={collapsed}
              expanded={collectionDisclosure}
              onToggleExpand={
                collapsed
                  ? undefined
                  : () => setCollectionDisclosure(!collectionDisclosure)
              }
            />
            {!collapsed && (
              <Transition
                show={collectionDisclosure}
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0 -translate-y-3"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition duration-100 ease-out"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-3"
              >
                <div className="pl-4">
                  <CollectionListing />
                </div>
              </Transition>
            )}
            <SidebarHighlightLink
              title={t("tags")}
              href={`/tags`}
              icon={"bi-hash"}
              active={active === `/tags`}
              sidebarIsCollapsed={collapsed}
              expanded={tagDisclosure}
              onToggleExpand={
                collapsed ? undefined : () => setTagDisclosure(!tagDisclosure)
              }
            />
            {!collapsed && (
              <Transition
                show={tagDisclosure}
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0 -translate-y-3"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition duration-100 ease-out"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-3"
              >
                <div className="pl-4 flex flex-col gap-1">
                  {isLoading ? (
                    <div className="flex flex-col gap-4">
                      <div className="skeleton h-4 w-full"></div>
                      <div className="skeleton h-4 w-full"></div>
                      <div className="skeleton h-4 w-full"></div>
                    </div>
                  ) : (
                    <>
                      <TagListing tags={tags} active={active} />
                      {hasNextPage && <div ref={ref} className="h-1 w-full" />}
                      {isFetchingNextPage && (
                        <div className="flex flex-col gap-4 mt-3">
                          <div className="skeleton h-4 w-full"></div>
                          <div className="skeleton h-4 w-full"></div>
                          <div className="skeleton h-4 w-full"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Transition>
            )}
          </div>
        );

        return (
          <>
            {collapsed ? (
              <div className="flex flex-col items-center gap-3 shrink-0">
                <ActionIcon
                  icon="bi-search"
                  variant="default"
                  label={t("search_for_links")}
                  tooltipSide="right"
                  onClick={() => openModal(setSearchModal)}
                />
                <DropdownMenu>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="primary"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-label={t("create_new")}
                          >
                            <i className="bi-plus-lg text-lg leading-none" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {t("create_new")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem
                      onSelect={() => openModal(setNewLinkModal)}
                    >
                      <i className="bi-link-45deg" />
                      {t("new_link")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => openModal(setNewCollectionModal)}
                    >
                      <i className="bi-folder-plus" />
                      {t("new_collection")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => openModal(setNewTagModal)}
                    >
                      <i className="bi-tag" />
                      {t("new_tag")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => openModal(setUploadFileModal)}
                    >
                      <i className="bi-file-earmark-arrow-up" />
                      {t("upload_file")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex flex-col gap-2 shrink-0 pt-1 px-1">
                <Button
                  size="sm"
                  variant="default"
                  className="justify-between whitespace-nowrap h-8"
                  onClick={() => openModal(setSearchModal)}
                >
                  <div className="flex gap-2 items-center">
                    <i className="bi-search leading-none" />
                    {t("search_for_links")}
                  </div>
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="primary"
                    className="flex-1 min-w-0 h-9 justify-center whitespace-nowrap"
                    onClick={() => openModal(setNewLinkModal)}
                  >
                    <i className="bi-plus-lg text-lg leading-none" />
                    {t("new_link")}
                  </Button>

                  <ActionIcon
                    icon="bi-folder-plus"
                    variant="default"
                    label={t("new_collection")}
                    onClick={() => openModal(setNewCollectionModal)}
                  />
                  <ActionIcon
                    icon="bi-tag"
                    variant="default"
                    label={t("new_tag")}
                    onClick={() => openModal(setNewTagModal)}
                  />

                  <DropdownMenu>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="default"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              aria-label={t("more")}
                            >
                              <i className="bi-three-dots text-lg leading-none" />
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>{t("more")}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => openModal(setUploadFileModal)}
                      >
                        <i className="bi-file-earmark-arrow-up" />
                        {t("upload_file")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {collapsed ? (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                {navLinks}
              </div>
            ) : (
              <SidebarScrollArea>{navLinks}</SidebarScrollArea>
            )}
            {searchModal && (
              <SearchModal onClose={() => setSearchModal(false)} />
            )}
            {newLinkModal && (
              <NewLinkModal onClose={() => setNewLinkModal(false)} />
            )}
            {newCollectionModal && (
              <NewCollectionModal
                onClose={() => setNewCollectionModal(false)}
              />
            )}
            {newTagModal && (
              <NewTagModal onClose={() => setNewTagModal(false)} />
            )}
            {uploadFileModal && (
              <UploadFileModal onClose={() => setUploadFileModal(false)} />
            )}
          </>
        );
      }}
    </SidebarShell>
  );
}
