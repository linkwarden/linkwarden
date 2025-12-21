import NoLinksFound from "@/components/NoLinksFound";
import { useLinks } from "@linkwarden/router/links";
import MainLayout from "@/layouts/MainLayout";
import React, { ReactElement, useEffect, useState } from "react";
import { Sort, ViewMode } from "@linkwarden/types";
import { useRouter } from "next/router";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import Links from "@/components/LinkViews/Links";
import clsx from "clsx";
import { NextPageWithLayout } from "../_app";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const { links, data } = useLinks({
    sort: sortBy,
  });

  const router = useRouter();

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  return (
    <div className="p-5 flex flex-col gap-5 w-full h-full">
      <LinkListOptions
        t={t}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        editMode={editMode}
        setEditMode={setEditMode}
        links={links}
      >
        <div className={clsx("flex items-center gap-3")}>
          <i className={`bi-link-45deg text-primary text-3xl drop-shadow`}></i>
          <div>
            <p className="text-2xl capitalize font-thin">{t("all_links")}</p>
            <p className="text-xs sm:text-sm">{t("all_links_desc")}</p>
          </div>
        </div>
      </LinkListOptions>

      {!data.isLoading && links && !links[0] && (
        <NoLinksFound text={t("you_have_not_added_any_links")} />
      )}
      <Links
        editMode={editMode}
        links={links}
        layout={viewMode}
        useData={data}
      />
    </div>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;

export { getServerSideProps };
