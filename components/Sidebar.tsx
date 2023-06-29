import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faBox,
  faHashtag,
  faChartSimple,
  faChevronDown,
  faLink,
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
      className={`bg-gray-100 h-screen w-64 xl:w-80 overflow-y-auto border-solid border-r-sky-100 px-2 border z-20 ${className}`}
    >
      <p className="p-2 text-sky-500 font-bold text-2xl my-2 leading-4">
        Linkwarden
      </p>

      <div className="flex flex-col gap-1">
        <Link href="/dashboard">
          <div
            className={`${
              active === "/dashboard"
                ? "bg-sky-200"
                : "hover:bg-slate-200 bg-gray-100"
            } outline-sky-100 outline-1 duration-100 py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faChartSimple}
              className={`w-6 h-6 drop-shadow text-sky-500`}
            />
            <p className="text-sky-600">Dashboard</p>
          </div>
        </Link>

        <Link href="/links">
          <div
            className={`${
              active === "/links"
                ? "bg-sky-200"
                : "hover:bg-slate-200 bg-gray-100"
            } outline-sky-100 outline-1 duration-100 py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faLink}
              className={`w-6 h-6 drop-shadow text-sky-500`}
            />
            <p className="text-sky-600">All Links</p>
          </div>
        </Link>

        <Link href="/collections">
          <div
            className={`${
              active === "/collections" ? "bg-sky-200" : "hover:bg-slate-200"
            } outline-sky-100 outline-1 duration-100  py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faBox}
              className={`w-6 h-6 drop-shadow text-sky-500`}
            />
            <p className="text-sky-600">All Collections</p>
          </div>
        </Link>
      </div>

      <Disclosure defaultOpen={collectionDisclosure}>
        <Disclosure.Button
          onClick={() => {
            setCollectionDisclosure(!collectionDisclosure);
          }}
          className="flex items-center justify-between text-sm w-full text-left mb-2 pl-2 font-bold text-gray-500 mt-5"
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
            {collections
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e, i) => {
                return (
                  <Link key={i} href={`/collections/${e.id}`}>
                    <div
                      className={`${
                        active === `/collections/${e.id}`
                          ? "bg-sky-200"
                          : "hover:bg-slate-200 bg-gray-100"
                      } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
                    >
                      <FontAwesomeIcon
                        icon={faFolder}
                        className="w-6 h-6 drop-shadow"
                        style={{ color: e.color }}
                      />

                      <p className="text-sky-600 truncate w-4/6">{e.name}</p>
                    </div>
                  </Link>
                );
              })}
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
      <Disclosure defaultOpen={tagDisclosure}>
        <Disclosure.Button
          onClick={() => {
            setTagDisclosure(!tagDisclosure);
          }}
          className="flex items-center justify-between text-sm w-full text-left mb-2 pl-2 font-bold text-gray-500 mt-5"
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
            {tags
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((e, i) => {
                return (
                  <Link key={i} href={`/tags/${e.id}`}>
                    <div
                      className={`${
                        active === `/tags/${e.id}`
                          ? "bg-sky-200"
                          : "hover:bg-slate-200 bg-gray-100"
                      } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
                    >
                      <FontAwesomeIcon
                        icon={faHashtag}
                        className="w-4 h-4 text-sky-500 mt-1"
                      />

                      <p className="text-sky-600 truncate w-4/6">{e.name}</p>
                    </div>
                  </Link>
                );
              })}
          </Disclosure.Panel>
        </Transition>
      </Disclosure>
    </div>
  );
}
