import MainLayout from "@/layouts/MainLayout";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Sort, ViewMode } from "@/types/global";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import LinkListOptions from "@/components/LinkListOptions";
import { useLinks } from "@/hooks/store/links";
import Links from "@/components/LinkViews/Links";

export default function PinnedLinks() {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const { links, data } = useLinks({
    sort: sortBy,
    pinnedOnly: true,
  });

  const router = useRouter();
  const [editMode, setEditMode] = useState(false);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <LinkListOptions
          t={t}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          editMode={editMode}
          setEditMode={setEditMode}
        >
          <PageHeader
            icon={"bi-pin-angle"}
            title={t("pinned")}
            description={t("pinned_links_desc")}
          />
        </LinkListOptions>

        {!data.isLoading && links && !links[0] && (
          <div
            style={{ flex: "1 1 auto" }}
            className="flex flex-col gap-2 justify-center h-full w-full mx-auto p-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-1/4 min-w-[7rem] max-w-[15rem] h-auto mx-auto mb-5 text-primary drop-shadow"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354m1.58 1.408-.002-.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a5 5 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a5 5 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.8 1.8 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14q.091.15.214.271a1.8 1.8 0 0 0 .37.282" />
            </svg>
            <p className="text-center text-2xl">
              {t("pin_favorite_links_here")}
            </p>
            <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
              {t("pin_favorite_links_here_desc")}
            </p>
          </div>
        )}
        <Links
          editMode={editMode}
          links={links}
          layout={viewMode}
          placeholderCount={1}
          useData={data}
        />
      </div>
    </MainLayout>
  );
}

export { getServerSideProps };
