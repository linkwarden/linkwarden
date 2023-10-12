import useCollectionStore from "@/store/collections";
import {
  faChartSimple,
  faChevronDown,
  faThumbTack,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import useTagStore from "@/store/tags";
import LinkCard from "@/components/LinkCard";
import { useEffect, useState } from "react";
import useLinks from "@/hooks/useLinks";

export default function Dashboard() {
  const { collections } = useCollectionStore();
  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const [numberOfLinks, setNumberOfLinks] = useState(0);

  const [linkPinDisclosure, setLinkPinDisclosure] = useState<boolean>(() => {
    const storedValue =
      typeof window !== "undefined" &&
      localStorage.getItem("linkPinDisclosure");
    return storedValue ? storedValue === "true" : true;
  });

  useLinks({ pinnedOnly: true, sort: 0 });

  useEffect(() => {
    setNumberOfLinks(
      collections.reduce(
        (accumulator, collection) =>
          accumulator + (collection._count as any).links,
        0
      )
    );
  }, [collections]);

  useEffect(() => {
    localStorage.setItem(
      "linkPinDisclosure",
      linkPinDisclosure ? "true" : "false"
    );
  }, [linkPinDisclosure]);

  return (
    <MainLayout>
      <div style={{ flex: "1 1 auto" }} className="p-5 flex flex-col gap-5">
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            <FontAwesomeIcon
              icon={faChartSimple}
              className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 dark:text-sky-500 drop-shadow"
            />
            <p className="sm:text-4xl text-3xl text-black dark:text-white">
              Dashboard
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="sky-shadow flex flex-col justify-center items-center gap-2 md:w-full rounded-2xl p-10 border border-sky-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
            <p className="font-bold text-6xl text-sky-500 dark:text-sky-500">
              {numberOfLinks}
            </p>
            <p className="text-black dark:text-white text-xl">
              {numberOfLinks === 1 ? "Link" : "Links"}
            </p>
          </div>

          <div className="sky-shadow flex flex-col justify-center items-center gap-2 md:w-full rounded-2xl p-10 border border-sky-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
            <p className="font-bold text-6xl text-sky-500 dark:text-sky-500">
              {collections.length}
            </p>
            <p className="text-black dark:text-white text-xl">
              {collections.length === 1 ? "Collection" : "Collections"}
            </p>
          </div>

          <div className="sky-shadow flex flex-col justify-center items-center gap-2 md:w-full rounded-2xl p-10 border border-sky-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
            <p className="font-bold text-6xl text-sky-500 dark:text-sky-500">
              {tags.length}
            </p>
            <p className="text-black dark:text-white text-xl">
              {tags.length === 1 ? "Tag" : "Tags"}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              icon={faThumbTack}
              className="w-5 h-5 text-sky-500 dark:text-sky-500 drop-shadow"
            />
            <p className="text-2xl text-black dark:text-white">Pinned Links</p>
          </div>
          {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
            <button
              className="text-black dark:text-white flex items-center gap-2 cursor-pointer"
              onClick={() => setLinkPinDisclosure(!linkPinDisclosure)}
            >
              {linkPinDisclosure ? "Show Less" : "Show More"}
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-4 h-4 text-black dark:text-white ${
                  linkPinDisclosure ? "rotate-reverse" : "rotate"
                }`}
              />
            </button>
          ) : undefined}
        </div>

        <div
          style={{ flex: "1 1 auto" }}
          className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
        >
          {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
            <div className="w-full">
              <div
                className={`grid overflow-hidden 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5 w-full ${
                  linkPinDisclosure ? "h-full" : "h-44"
                }`}
              >
                {links
                  .filter((e) => e.pinnedBy && e.pinnedBy[0])
                  .map((e, i) => (
                    <LinkCard key={i} link={e} count={i} />
                  ))}
              </div>
            </div>
          ) : (
            <div
              style={{ flex: "1 1 auto" }}
              className="sky-shadow flex flex-col justify-center h-full border border-solid border-sky-100 dark:border-neutral-700 w-full mx-auto p-10 rounded-2xl bg-gray-50 dark:bg-neutral-800"
            >
              <p className="text-center text-2xl text-black dark:text-white">
                Pin Your Favorite Links Here!
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
                You can Pin your favorite Links by clicking on the three dots on
                each Link and clicking{" "}
                <span className="font-semibold">Pin to Dashboard</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
