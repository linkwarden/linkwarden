import useCollectionStore from "@/store/collections";
import {
  faChartSimple,
  faChevronRight,
  faClockRotateLeft,
  faFileImport,
  faFolder,
  faHashtag,
  faLink,
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
import DashboardItem from "@/components/DashboardItem";

export default function Dashboard() {
  const { collections } = useCollectionStore();
  const { links } = useLinkStore();
  const { tags } = useTagStore();

  const { setModal } = useModalStore();

  const [numberOfLinks, setNumberOfLinks] = useState(0);

  const [showLinks, setShowLinks] = useState(3);

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

  const handleNumberOfLinksToShow = () => {
    if (window.innerWidth > 1535) {
      setShowLinks(6);
    } else if (window.innerWidth > 1295) {
      setShowLinks(4);
    } else setShowLinks(3);
  };

  const { width } = useWindowDimensions();

  useEffect(() => {
    handleNumberOfLinksToShow();
  }, [width]);

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
        <div className="flex items-center gap-3">
          <FontAwesomeIcon
            icon={faChartSimple}
            className="sm:w-10 sm:h-10 w-6 h-6 text-primary drop-shadow"
          />
          <div>
            <p className="text-3xl capitalize font-thin">Dashboard</p>

            <p>A brief overview of your data</p>
          </div>
        </div>

        <div>
          <div className="flex justify-evenly flex-col md:flex-row md:items-center gap-2 md:w-full h-full rounded-2xl p-8 border border-neutral-content bg-base-200">
            <DashboardItem
              name={numberOfLinks === 1 ? "Link" : "Links"}
              value={numberOfLinks}
              icon={faLink}
            />

            <hr className="border-neutral-content md:hidden my-5" />
            <div className="h-24 border-1 border-l border-neutral-content hidden md:block"></div>

            <DashboardItem
              name={collections.length === 1 ? "Collection" : "Collections"}
              value={collections.length}
              icon={faFolder}
            />

            <hr className="border-neutral-content md:hidden my-5" />
            <div className="h-24 border-1 border-r border-neutral-content hidden md:block"></div>

            <DashboardItem
              name={tags.length === 1 ? "Tag" : "Tags"}
              value={tags.length}
              icon={faHashtag}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              icon={faClockRotateLeft}
              className="w-5 h-5 text-primary drop-shadow"
            />
            <p className="text-2xl">Recently Added Links</p>
          </div>
          <Link
            href="/links"
            className="flex items-center gap-2 cursor-pointer"
          >
            View All
            <FontAwesomeIcon icon={faChevronRight} className={`w-4 h-4`} />
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
                {links.slice(0, showLinks).map((e, i) => (
                  <LinkCard key={i} link={e} count={i} />
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{ flex: "1 1 auto" }}
              className="sky-shadow flex flex-col justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-2xl bg-base-200"
            >
              <p className="text-center text-2xl">
                View Your Recently Added Links Here!
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm mt-2">
                This section will view your latest added Links across every
                Collections you have access to.
              </p>

              <div className="text-center w-full mt-4 flex flex-wrap gap-4 justify-center">
                <div
                  onClick={() => {
                    setModal({
                      modal: "LINK",
                      state: true,
                      method: "CREATE",
                    });
                  }}
                  className="inline-flex gap-1 relative w-[11rem] items-center btn btn-accent text-white group"
                >
                  <FontAwesomeIcon
                    icon={faPlus}
                    className="w-5 h-5 left-4 group-hover:ml-[4rem] absolute duration-100"
                  />
                  <span className="group-hover:opacity-0 text-right w-full duration-100">
                    Create New Item
                  </span>
                </div>

                <details className="dropdown">
                  <summary className="flex gap-2 text-sm btn btn-outline group">
                    <FontAwesomeIcon
                      icon={faFileImport}
                      className="w-5 h-5 duration-100"
                      id="import-dropdown"
                    />
                    <span className="duration-100" id="import-dropdown">
                      Import Your Bookmarks
                    </span>
                  </summary>
                  <ul className="shadow menu dropdown-content z-[1] p-1 bg-base-200 border border-neutral-content rounded-xl mt-1 w-60">
                    <li>
                      <label
                        className="px-2 py-1 rounded-lg"
                        htmlFor="import-linkwarden-file"
                        title="JSON File"
                      >
                        From Linkwarden
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
                    </li>
                    <li>
                      <label
                        className="px-2 py-1 rounded-lg"
                        htmlFor="import-html-file"
                        title="HTML File"
                      >
                        From Bookmarks HTML file
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
                    </li>
                  </ul>
                </details>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon
              icon={faThumbTack}
              className="w-5 h-5 text-primary drop-shadow"
            />
            <p className="text-2xl">Pinned Links</p>
          </div>
          <Link
            href="/links/pinned"
            className="flex items-center gap-2 cursor-pointer"
          >
            View All
            <FontAwesomeIcon icon={faChevronRight} className={`w-4 h-4`} />
          </Link>
        </div>

        <div
          style={{ flex: "1 1 auto" }}
          className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
        >
          {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
            <div className="w-full">
              <div
                className={`grid overflow-hidden 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5 w-full`}
              >
                {links

                  .filter((e) => e.pinnedBy && e.pinnedBy[0])
                  .map((e, i) => <LinkCard key={i} link={e} count={i} />)
                  .slice(0, showLinks)}
              </div>
            </div>
          ) : (
            <div
              style={{ flex: "1 1 auto" }}
              className="sky-shadow flex flex-col justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-2xl bg-base-200"
            >
              <p className="text-center text-2xl">
                Pin Your Favorite Links Here!
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm mt-2">
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
