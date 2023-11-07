import useCollectionStore from "@/store/collections";
import {
  faChartSimple,
  faChevronDown,
  faChevronRight,
  faClockRotateLeft,
  faFileImport,
  faThumbTack,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import useTagStore from "@/store/tags";
import LinkCard from "@/components/LinkCard";
import { useEffect, useState } from "react";
import useLinks from "@/hooks/useLinks";
import Link from "next/link";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import useModalStore from "@/store/modals";
import { toast } from "react-hot-toast";
import { MigrationFormat, MigrationRequest } from "@/types/global";
import ClickAwayHandler from "@/components/ClickAwayHandler";

export default function Dashboard() {
  const { collections } = useCollectionStore();
  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const { setModal } = useModalStore();

  const [numberOfLinks, setNumberOfLinks] = useState(0);

  const [showRecents, setShowRecents] = useState(3);

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

  const handleNumberOfRecents = () => {
    if (window.innerWidth > 1550) {
      setShowRecents(6);
    } else if (window.innerWidth > 1295) {
      setShowRecents(4);
    } else setShowRecents(3);
  };

  const { width } = useWindowDimensions();

  useEffect(() => {
    handleNumberOfRecents();
  }, [width]);

  const [importDropdown, setImportDropdown] = useState(false);

  const importBookmarks = async (e: any, format: MigrationFormat) => {
    const file: File = e.target.files[0];

    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = async function (e) {
        const load = toast.loading("Importing...");

        const request: string = e.target?.result as string;

        const body: MigrationRequest = {
          format,
          data: request,
        };

        const response = await fetch("/api/v1/migration", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = await response.json();

        toast.dismiss(load);

        toast.success("Imported the Bookmarks! Reloading the page...");

        setImportDropdown(false);

        setTimeout(() => {
          location.reload();
        }, 2000);
      };
      reader.onerror = function (e) {
        console.log("Error:", e);
      };
    }
  };

  return (
    <MainLayout>
      <div style={{ flex: "1 1 auto" }} className="p-5 flex flex-col gap-5">
        <div className="flex gap-3 items-center">
          <div className="flex gap-2">
            <FontAwesomeIcon
              icon={faChartSimple}
              className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 dark:text-sky-500 drop-shadow"
            />
            <p className="sm:text-4xl text-3xl text-black dark:text-white font-thin">
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
              icon={faClockRotateLeft}
              className="w-5 h-5 text-sky-500 dark:text-sky-500 drop-shadow"
            />
            <p className="text-2xl text-black dark:text-white">
              Recently Added Links
            </p>
          </div>
          <Link
            href="/links"
            className="text-black dark:text-white flex items-center gap-2 cursor-pointer"
          >
            View All
            <FontAwesomeIcon
              icon={faChevronRight}
              className={`w-4 h-4 text-black dark:text-white`}
            />
          </Link>
        </div>

        <div
          style={{ flex: "0 1 auto" }}
          className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
        >
          {links[0] ? (
            <div className="w-full">
              <div
                className={`grid overflow-hidden 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5 w-full`}
              >
                {links.slice(0, showRecents).map((e, i) => (
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
                View Your Recently Added Links Here!
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-gray-500 dark:text-gray-300 text-sm mt-2">
                This section will view your latest added Links across every
                Collections you have access to.
              </p>

              <div className="text-center text-black dark:text-white w-full mt-4 flex flex-wrap gap-4 justify-center">
                <div
                  onClick={() => {
                    setModal({
                      modal: "LINK",
                      state: true,
                      method: "CREATE",
                    });
                  }}
                  className="inline-flex gap-1 relative w-[11.4rem] items-center font-semibold select-none cursor-pointer p-2 px-3 rounded-md dark:hover:bg-sky-600 text-white bg-sky-700 hover:bg-sky-600 duration-100 group"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="w-5 h-5 group-hover:ml-[4.325rem] absolute duration-100"
                  />
                  <span className="group-hover:opacity-0 text-right w-full duration-100">
                    Create New Link
                  </span>
                </div>

                <div className="relative">
                  <div
                    onClick={() => setImportDropdown(!importDropdown)}
                    id="import-dropdown"
                    className="flex gap-2 select-none text-sm cursor-pointer p-2 px-3 rounded-md border dark:hover:border-sky-600 text-black border-black dark:text-white dark:border-white hover:border-sky-500 hover:dark:border-sky-500 hover:text-sky-500 hover:dark:text-sky-500 duration-100 group"
                  >
                    <FontAwesomeIcon
                      icon={faFileImport}
                      className="w-5 h-5 duration-100"
                      id="import-dropdown"
                    />
                    <span
                      className="text-right w-full duration-100"
                      id="import-dropdown"
                    >
                      Import Your Bookmarks
                    </span>
                  </div>
                  {importDropdown ? (
                    <ClickAwayHandler
                      onClickOutside={(e: Event) => {
                        const target = e.target as HTMLInputElement;
                        if (target.id !== "import-dropdown")
                          setImportDropdown(false);
                      }}
                      className={`absolute text-black dark:text-white top-10 left-0 w-52 py-1 shadow-md border border-sky-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-md flex flex-col z-20`}
                    >
                      <div className="cursor-pointer rounded-md">
                        <label
                          htmlFor="import-linkwarden-file"
                          title="JSON File"
                          className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200 hover:dark:bg-neutral-700  duration-100 cursor-pointer"
                        >
                          Linkwarden File...
                          <input
                            type="file"
                            name="photo"
                            id="import-linkwarden-file"
                            accept=".json"
                            className="hidden"
                            onChange={(e) =>
                              importBookmarks(e, MigrationFormat.linkwarden)
                            }
                          />
                        </label>
                        <label
                          htmlFor="import-html-file"
                          title="HTML File"
                          className="flex items-center gap-2 py-1 px-2 hover:bg-slate-200 hover:dark:bg-neutral-700  duration-100 cursor-pointer"
                        >
                          Bookmarks HTML file...
                          <input
                            type="file"
                            name="photo"
                            id="import-html-file"
                            accept=".html"
                            className="hidden"
                            onChange={(e) =>
                              importBookmarks(e, MigrationFormat.htmlFile)
                            }
                          />
                        </label>
                      </div>
                    </ClickAwayHandler>
                  ) : null}
                </div>
              </div>
            </div>
          )}
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
                  linkPinDisclosure ? "h-full" : "max-h-[22rem]"
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
