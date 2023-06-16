import useCollectionStore from "@/store/collections";
import {
  faChartSimple,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import useTagStore from "@/store/tags";
import LinkCard from "@/components/LinkCard";
import Link from "next/link";
import CollectionCard from "@/components/CollectionCard";
import { Disclosure, Transition } from "@headlessui/react";
import { useEffect, useState } from "react";
import useLinks from "@/hooks/useLinks";

export default function Dashboard() {
  const { collections } = useCollectionStore();
  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const [tagPinDisclosure, setTagPinDisclosure] = useState<boolean>(() => {
    const storedValue = localStorage.getItem("tagPinDisclosure");
    return storedValue ? storedValue === "true" : true;
  });

  const [collectionPinDisclosure, setCollectionPinDisclosure] =
    useState<boolean>(() => {
      const storedValue = localStorage.getItem("collectionPinDisclosure");
      return storedValue ? storedValue === "true" : true;
    });

  const [linkPinDisclosure, setLinkPinDisclosure] = useState<boolean>(() => {
    const storedValue = localStorage.getItem("linkPinDisclosure");
    return storedValue ? storedValue === "true" : true;
  });

  useLinks({ pinnedOnly: true, sort: 0 });

  useEffect(() => {
    localStorage.setItem(
      "tagPinDisclosure",
      tagPinDisclosure ? "true" : "false"
    );
  }, [tagPinDisclosure]);

  useEffect(() => {
    localStorage.setItem(
      "collectionPinDisclosure",
      collectionPinDisclosure ? "true" : "false"
    );
  }, [collectionPinDisclosure]);

  useEffect(() => {
    localStorage.setItem(
      "linkPinDisclosure",
      linkPinDisclosure ? "true" : "false"
    );
  }, [linkPinDisclosure]);

  return (
    // ml-80
    <MainLayout>
      <div className="p-5">
        <div className="flex gap-3 items-center mb-5">
          <div className="flex gap-2">
            <FontAwesomeIcon
              icon={faChartSimple}
              className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 drop-shadow"
            />
            <p className="sm:text-4xl text-3xl capitalize bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent font-bold">
              Dashboard
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-evenly gap-2 mb-10">
          <div className="flex items-baseline gap-2">
            <p className="font-bold text-6xl bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent">
              {collections.reduce(
                (accumulator, collection) =>
                  accumulator + collection._count.links,
                0
              )}
            </p>
            <p className="text-sky-900 text-xl">
              Links
              {/* {links.length == 1 ? "Links" : "Link"} */}
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="font-bold text-6xl bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent">
              {collections.length}
            </p>
            <p className="text-sky-900 text-xl">Collections</p>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="font-bold text-6xl bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent">
              {tags.length}
            </p>
            <p className="text-sky-900 text-xl">Tags</p>
          </div>
        </div>

        {/* <hr className="my-5 border-sky-100" /> */}
        <br />

        <div className="flex flex-col 2xl:flex-row items-start justify-evenly 2xl:gap-2">
          <Disclosure defaultOpen={linkPinDisclosure}>
            <div className="flex flex-col gap-5 p-2 w-full mx-auto md:w-2/3">
              <Disclosure.Button
                onClick={() => {
                  setLinkPinDisclosure(!linkPinDisclosure);
                }}
                className="flex justify-between gap-2 items-baseline shadow active:shadow-inner duration-100 py-2 px-4 rounded-full"
              >
                <p className="text-sky-600 text-xl">Pinned Links</p>

                <div className="text-sky-600 flex items-center gap-2">
                  {linkPinDisclosure ? "Hide" : "Show"}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`w-4 h-4 text-sky-300 ${
                      linkPinDisclosure ? "rotate-reverse" : "rotate"
                    }`}
                  />
                </div>
              </Disclosure.Button>

              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0 -translate-y-3"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition duration-100 ease-out"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-3"
              >
                <Disclosure.Panel className="flex flex-col gap-5 w-full">
                  {links
                    .filter((e) => e.pinnedBy)
                    .map((e, i) => (
                      <LinkCard key={i} link={e} count={i} />
                    ))}
                </Disclosure.Panel>
              </Transition>
            </div>
          </Disclosure>

          {/* <Disclosure defaultOpen={collectionPinDisclosure}>
            <div className="flex flex-col gap-5 p-2 w-full">
              <Disclosure.Button
                onClick={() => {
                  setCollectionPinDisclosure(!collectionPinDisclosure);
                }}
                className="flex justify-between gap-2 items-baseline shadow active:shadow-inner duration-100 py-2 px-4 rounded-full"
              >
                <p className="text-sky-600 text-xl">Pinned Collections</p>

                <div className="text-sky-600 flex items-center gap-2">
                  {collectionPinDisclosure ? "Hide" : "Show"}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`w-4 h-4 text-sky-300 ${
                      collectionPinDisclosure ? "rotate-reverse" : "rotate"
                    }`}
                  />
                </div>
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0 -translate-y-3"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition duration-100 ease-out"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-3"
              >
                <Disclosure.Panel className="flex flex-col gap-5 w-full">
                  {collections.slice(0, 5).map((e, i) => (
                    <CollectionCard key={i} collection={e} />
                  ))}
                </Disclosure.Panel>
              </Transition>
            </div>
          </Disclosure> */}

          {/* <Disclosure defaultOpen={tagPinDisclosure}>
            <div className="flex flex-col gap-5 p-2 w-full">
              <Disclosure.Button
                onClick={() => {
                  setTagPinDisclosure(!tagPinDisclosure);
                }}
                className="flex justify-between gap-2 items-baseline shadow active:shadow-inner duration-100 py-2 px-4 rounded-full"
              >
                <p className="text-sky-600 text-xl">Pinned Tags</p>

                <div className="text-sky-600 flex items-center gap-2">
                  {tagPinDisclosure ? "Hide" : "Show"}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className={`w-4 h-4 text-sky-300 ${
                      tagPinDisclosure ? "rotate-reverse" : "rotate"
                    }`}
                  />
                </div>
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform opacity-0 -translate-y-3"
                enterTo="transform opacity-100 translate-y-0"
                leave="transition duration-100 ease-out"
                leaveFrom="transform opacity-100 translate-y-0"
                leaveTo="transform opacity-0 -translate-y-3"
              >
                <Disclosure.Panel className="flex gap-2 flex-wrap">
                  {tags.slice(0, 19).map((e, i) => (
                    <Link
                      href={`/tags/${e.id}`}
                      key={i}
                      className="px-2 py-1 bg-sky-200 rounded-full hover:opacity-60 duration-100 text-sky-700"
                    >
                      {e.name}
                    </Link>
                  ))}
                </Disclosure.Panel>
              </Transition>
            </div>
          </Disclosure> */}
        </div>
      </div>
    </MainLayout>
  );
}
