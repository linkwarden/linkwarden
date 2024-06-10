import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import useTagStore from "@/store/tags";
import MainLayout from "@/layouts/MainLayout";
import { useEffect, useState } from "react";
import useLinks from "@/hooks/useLinks";
import Link from "next/link";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import React from "react";
import { toast } from "react-hot-toast";
import { MigrationFormat, MigrationRequest, ViewMode } from "@/types/global";
import DashboardItem from "@/components/DashboardItem";
import NewLinkModal from "@/components/ModalContent/NewLinkModal";
import PageHeader from "@/components/PageHeader";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import ViewDropdown from "@/components/ViewDropdown";
import { dropdownTriggerer } from "@/lib/client/utils";
import MasonryView from "@/components/LinkViews/Layouts/MasonryView";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";

export default function Dashboard() {
  const { t } = useTranslation();
  const { collections } = useCollectionStore();
  const { links } = useLinkStore();
  const { tags } = useTagStore();

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
    if (window.innerWidth > 1900) {
      setShowLinks(10);
    } else if (window.innerWidth > 1500) {
      setShowLinks(8);
    } else if (window.innerWidth > 880) {
      setShowLinks(6);
    } else if (window.innerWidth > 550) {
      setShowLinks(4);
    } else setShowLinks(2);
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

  const [newLinkModal, setNewLinkModal] = useState(false);

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );

  const linkView = {
    [ViewMode.Card]: CardView,
    // [ViewMode.Grid]: ,
    [ViewMode.List]: ListView,
    [ViewMode.Masonry]: MasonryView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div style={{ flex: "1 1 auto" }} className="p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <PageHeader
            icon={"bi-house "}
            title={"Dashboard"}
            description={t("dashboard_desc")}
          />
          <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        <div>
          <div className="flex justify-evenly flex-col xl:flex-row xl:items-center gap-2 xl:w-full h-full rounded-2xl p-8 border border-neutral-content bg-base-200">
            <DashboardItem
              name={numberOfLinks === 1 ? t("link") : t("links")}
              value={numberOfLinks}
              icon={"bi-link-45deg"}
            />

            <div className="divider xl:divider-horizontal"></div>

            <DashboardItem
              name={
                collections.length === 1 ? t("collection") : t("collections")
              }
              value={collections.length}
              icon={"bi-folder"}
            />

            <div className="divider xl:divider-horizontal"></div>

            <DashboardItem
              name={tags.length === 1 ? t("tag") : t("tags")}
              value={tags.length}
              icon={"bi-hash"}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <PageHeader
              icon={"bi-clock-history"}
              title={t("recent")}
              description={t("recent_links_desc")}
            />
          </div>
          <Link
            href="/links"
            className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
          >
            {t("view_all")}
            <i className="bi-chevron-right text-sm"></i>
          </Link>
        </div>

        <div
          style={{ flex: links[0] ? "0 1 auto" : "1 1 auto" }}
          className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
        >
          {links[0] ? (
            <div className="w-full">
              <LinkComponent links={links.slice(0, showLinks)} />
            </div>
          ) : (
            <div className="sky-shadow flex flex-col justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-2xl bg-base-200">
              <p className="text-center text-2xl">
                {t("view_added_links_here")}
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm mt-2">
                {t("view_added_links_here_desc")}
              </p>

              <div className="text-center w-full mt-4 flex flex-wrap gap-4 justify-center">
                <div
                  onClick={() => {
                    setNewLinkModal(true);
                  }}
                  className="inline-flex items-center gap-2 text-sm btn btn-accent dark:border-violet-400 text-white"
                >
                  <i className="bi-plus-lg text-xl"></i>
                  <span className="group-hover:opacity-0 text-right">
                    {t("add_link")}
                  </span>
                </div>

                <div className="dropdown dropdown-bottom">
                  <div
                    tabIndex={0}
                    role="button"
                    onMouseDown={dropdownTriggerer}
                    className="inline-flex items-center gap-2 text-sm btn bg-neutral-content text-secondary-foreground hover:bg-neutral-content/80 border border-neutral/30 hover:border hover:border-neutral/30"
                    id="import-dropdown"
                  >
                    <i className="bi-cloud-upload text-xl duration-100"></i>
                    <p>{t("import_links")}</p>
                  </div>
                  <ul className="shadow menu dropdown-content z-[1] bg-base-200 border border-neutral-content rounded-box mt-1 w-60">
                    <li>
                      <label
                        tabIndex={0}
                        role="button"
                        htmlFor="import-linkwarden-file"
                        title={t("from_linkwarden")}
                      >
                        {t("from_linkwarden")}
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
                        tabIndex={0}
                        role="button"
                        htmlFor="import-html-file"
                        title={t("from_html")}
                      >
                        {t("from_html")}
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
                    <li>
                      <label
                        tabIndex={0}
                        role="button"
                        htmlFor="import-wallabag-file"
                        title={t("from_wallabag")}
                      >
                        {t("from_wallabag")}
                        <input
                          type="file"
                          name="photo"
                          id="import-wallabag-file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) =>
                            importBookmarks(e, MigrationFormat.wallabag)
                          }
                        />
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <PageHeader
              icon={"bi-pin-angle"}
              title={t("pinned")}
              description={t("pinned_links_desc")}
            />
          </div>
          <Link
            href="/links/pinned"
            className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
          >
            {t("view_all")}
            <i className="bi-chevron-right text-sm "></i>
          </Link>
        </div>

        <div
          style={{ flex: "1 1 auto" }}
          className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
        >
          {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
            <div className="w-full">
              <LinkComponent
                links={links
                  .filter((e) => e.pinnedBy && e.pinnedBy[0])
                  .slice(0, showLinks)}
              />
            </div>
          ) : (
            <div
              style={{ flex: "1 1 auto" }}
              className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-2xl bg-base-200"
            >
              <i className="bi-pin mx-auto text-6xl text-primary"></i>
              <p className="text-center text-2xl">
                {t("pin_favorite_links_here")}
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
                {t("pin_favorite_links_here_desc")}
              </p>
            </div>
          )}
        </div>
      </div>
      {newLinkModal ? (
        <NewLinkModal onClose={() => setNewLinkModal(false)} />
      ) : undefined}
    </MainLayout>
  );
}

export { getServerSideProps };
