import { useLinks } from "@linkwarden/router/links";
import MainLayout from "@/layouts/MainLayout";
import {
  LinkIncludingShortenedCollectionAndTags,
  Sort,
  ViewMode,
} from "@linkwarden/types";
import { useRouter } from "next/router";
import React, { ReactElement, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import Links from "@/components/LinkViews/Links";
import { NextPageWithLayout } from "./_app";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );

  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const [editMode, setEditMode] = useState(false);
  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const { links, data } = useLinks({
    sort: sortBy,
    searchQueryString: decodeURIComponent(router.query.q as string),
  });

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
        <PageHeader icon={"bi-search"} title={t("search_results")} />
      </LinkListOptions>

      {!data.isLoading && links && !links[0] && <p>{t("nothing_found")}</p>}
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
