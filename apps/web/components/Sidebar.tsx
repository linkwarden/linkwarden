import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import SidebarHighlightLink from "@/components/SidebarHighlightLink";
import CollectionListing from "@/components/CollectionListing";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import { TagListing } from "./TagListing";

export default function Sidebar({ className }: { className?: string }) {
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
      className={`bg-base-200 h-full w-80 overflow-y-auto border-solid border border-base-200 border-r-neutral-content p-2 z-20 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-1">
        <SidebarHighlightLink
          title={t("dashboard")}
          href={`/dashboard`}
          icon={"bi-house"}
          active={active === `/dashboard`}
        />
        <SidebarHighlightLink
          title={t("all_links")}
          href={`/links`}
          icon={"bi-link-45deg"}
          active={active === `/links`}
        />
        <SidebarHighlightLink
          title={t("pinned_links")}
          href={`/links/pinned`}
          icon={"bi-pin-angle"}
          active={active === `/links/pinned`}
        />
        <SidebarHighlightLink
          title={t("all_collections")}
          href={`/collections`}
          icon={"bi-folder"}
          active={active === `/collections`}
        />
        <SidebarHighlightLink
          title={t("all_tags")}
          href={`/tags`}
          icon={"bi-hash"}
          active={active === `/tags`}
        />
      </div>

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
    </div>
  );
}
