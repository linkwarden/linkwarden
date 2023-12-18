import useCollectionStore from "@/store/collections";
import useTagStore from "@/store/tags";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Disclosure, Transition } from "@headlessui/react";

export default function Sidebar({ className }: { className?: string }) {
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

  const { collections } = useCollectionStore();
  const { tags } = useTagStore();

  const router = useRouter();

  const [active, setActive] = useState("");

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
      className={`bg-base-200 h-full w-64 xl:w-80 overflow-y-auto border-solid border border-base-200 border-r-neutral-content px-2 z-20 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-1 mt-2">
        <Link href={`/dashboard`}>
          <div
            className={`${
              active === `/dashboard` ? "bg-primary/20" : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <i className="bi-house text-primary text-2xl drop-shadow"></i>
            <p className="truncate w-full">Dashboard</p>
          </div>
        </Link>

        <Link href={`/links`}>
          <div
            className={`${
              active === `/links` ? "bg-primary/20" : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <i className="bi-link-45deg text-primary text-2xl drop-shadow"></i>
            <p className="truncate w-full">All Links</p>
          </div>
        </Link>

        <Link href={`/collections`}>
          <div
            className={`${
              active === `/collections`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <i className="bi-folder text-primary text-2xl drop-shadow"></i>
            <p className="truncate w-full">All Collections</p>
          </div>
        </Link>

        <Link href={`/links/pinned`}>
          <div
            className={`${
              active === `/links/pinned`
                ? "bg-primary/20"
                : "hover:bg-neutral/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <i className="bi-pin-angle text-primary text-2xl drop-shadow"></i>
            <p className="truncate w-full">Pinned Links</p>
          </div>
        </Link>
      </div>

      <Disclosure defaultOpen={collectionDisclosure}>
        <Disclosure.Button
          onClick={() => {
            setCollectionDisclosure(!collectionDisclosure);
          }}
          className="flex items-center justify-between w-full text-left mb-2 pl-2 font-bold text-neutral mt-5"
        >
          <p className="text-sm">Collections</p>
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
          <Disclosure.Panel className="flex flex-col gap-1">
            {collections[0] ? (
              collections
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((e, i) => {
                  return (
                    <Link key={i} href={`/collections/${e.id}`}>
                      <div
                        className={`${
                          active === `/collections/${e.id}`
                            ? "bg-primary/20"
                            : "hover:bg-neutral/20"
                        } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
                      >
                        <i
                          className="bi-folder-fill text-2xl drop-shadow"
                          style={{ color: e.color }}
                        ></i>
                        <p className="truncate w-full">{e.name}</p>

                        {e.isPublic ? (
                          <i
                            className="bi-globe2 text-sm text-black/50 dark:text-white/50 drop-shadow"
                            title="This collection is being shared publicly."
                          ></i>
                        ) : undefined}
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
                  You Have No Collections...
                </p>
              </div>
            )}
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
          <p className="text-sm">Tags</p>
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
            {tags[0] ? (
              tags
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((e, i) => {
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
                  You Have No Tags...
                </p>
              </div>
            )}
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    </div>
  );
}
