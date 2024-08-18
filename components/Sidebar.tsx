import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import SidebarHighlightLink from "@/components/SidebarHighlightLink";
import CollectionListing from "@/components/CollectionListing";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { useTags } from "@/hooks/store/tags";

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
      <div className="grid grid-cols-2 gap-2">
        <SidebarHighlightLink
          title={t("dashboard")}
          href={`/dashboard`}
          icon={"bi-house"}
          active={active === `/dashboard`}
        />
        <SidebarHighlightLink
          title={t("pinned")}
          href={`/links/pinned`}
          icon={"bi-pin-angle"}
          active={active === `/links/pinned`}
        />
        <SidebarHighlightLink
          title={t("all_links")}
          href={`/links`}
          icon={"bi-link-45deg"}
          active={active === `/links`}
        />
        <SidebarHighlightLink
          title={t("all_collections")}
          href={`/collections`}
          icon={"bi-folder"}
          active={active === `/collections`}
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
            ) : tags[0] ? (
              tags
                .sort((a: any, b: any) => a.name.localeCompare(b.name))
                .map((e: any, i: any) => {
                  return (
                    <Link key={i} href={`/tags/${e.id}`}>
                      <div
                        className={`${
                          active === `/tags/${e.id}`
                            ? "bg-primary/20"
                            : "hover:bg-neutral/20"
                        } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
                      >
                        <i className="bi-hash text-2xl text-primary drop-shadow"></i>
                        <p className="truncate w-full pr-7">{e.name}</p>
                        <div className="drop-shadow text-neutral text-xs">
                          {e._count?.links}
                        </div>
                      </div>
                    </Link>
                  );
                })
            ) : (
              <div
                className={`duration-100 py-1 px-2 flex items-center gap-2 w-full rounded-md h-8 capitalize`}
              >
                <p className="text-neutral text-xs font-semibold truncate w-full pr-7">
                  {t("you_have_no_tags")}
                </p>
              </div>
            )}
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    </div>
  );
}
