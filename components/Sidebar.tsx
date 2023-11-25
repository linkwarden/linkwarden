import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faHashtag,
  faChartSimple,
  faChevronDown,
  faLink,
  faGlobe,
  faThumbTack,
} from "@fortawesome/free-solid-svg-icons";
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
      className={`bg-base-200 dark:bg-neutral-800 h-full w-64 xl:w-80 overflow-y-auto border-solid border dark:border-neutral-800 border-r-neutral-content dark:border-r-neutral-700 px-2 z-20 ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-2 mt-2">
        <Link href={`/dashboard`}>
          <div
            className={`${
              active === `/dashboard`
                ? "bg-primary/20"
                : "hover:bg-slate-500/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <FontAwesomeIcon
              icon={faChartSimple}
              className="w-7 h-7 drop-shadow text-primary"
            />
            <p className="truncate w-full">Dashboard</p>
          </div>
        </Link>

        <Link href={`/links`}>
          <div
            className={`${
              active === `/links` ? "bg-primary/20" : "hover:bg-slate-500/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <FontAwesomeIcon
              icon={faLink}
              className="w-7 h-7 drop-shadow text-primary"
            />
            <p className="truncate w-full">All Links</p>
          </div>
        </Link>

        <Link href={`/collections`}>
          <div
            className={`${
              active === `/collections`
                ? "bg-primary/20"
                : "hover:bg-slate-500/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <FontAwesomeIcon
              icon={faFolder}
              className="w-7 h-7 drop-shadow text-primary"
            />
            <p className="truncate w-full">All Collections</p>
          </div>
        </Link>

        <Link href={`/links/pinned`}>
          <div
            className={`${
              active === `/links/pinned`
                ? "bg-primary/20"
                : "hover:bg-slate-500/20"
            } duration-100 py-5 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
          >
            <FontAwesomeIcon
              icon={faThumbTack}
              className="w-7 h-7 drop-shadow text-primary"
            />
            <p className="truncate w-full">Pinned Links</p>
          </div>
        </Link>
      </div>

      <Disclosure defaultOpen={collectionDisclosure}>
        <Disclosure.Button
          onClick={() => {
            setCollectionDisclosure(!collectionDisclosure);
          }}
          className="flex items-center justify-between text-sm w-full text-left mb-2 pl-2 font-bold text-neutral mt-5"
        >
          <p>Collections</p>

          <FontAwesomeIcon
            icon={faChevronDown}
            className={`w-3 h-3 ${
              collectionDisclosure ? "rotate-reverse" : "rotate"
            }`}
          />
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
                            : "hover:bg-slate-500/20"
                        } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
                      >
                        <FontAwesomeIcon
                          icon={faFolder}
                          className="w-6 h-6 drop-shadow"
                          style={{ color: e.color }}
                        />
                        <p className="truncate w-full">{e.name}</p>

                        {e.isPublic ? (
                          <FontAwesomeIcon
                            icon={faGlobe}
                            title="This collection is being shared publicly."
                            className="w-4 h-4 drop-shadow text-neutral"
                          />
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
          className="flex items-center justify-between text-sm w-full text-left mb-2 pl-2 font-bold text-neutral mt-5"
        >
          <p>Tags</p>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`w-3 h-3 ${tagDisclosure ? "rotate-reverse" : "rotate"}`}
          />
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
                            : "hover:bg-slate-500/20"
                        } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
                      >
                        <FontAwesomeIcon
                          icon={faHashtag}
                          className="w-4 h-4 text-primary mt-1"
                        />

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
