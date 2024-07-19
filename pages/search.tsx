import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import PageHeader from "@/components/PageHeader";
import { GridLoader } from "react-spinners";
import MasonryView from "@/components/LinkViews/Layouts/MasonryView";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";

export default function Search() {
  const { t } = useTranslation();

  const { links } = useLinkStore();

  const router = useRouter();

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    tags: true,
    textContent: false,
  });

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const { isLoading } = useLinks({
    sort: sortBy,
    searchQueryString: decodeURIComponent(router.query.q as string),
    searchByName: searchFilter.name,
    searchByUrl: searchFilter.url,
    searchByDescription: searchFilter.description,
    searchByTextContent: searchFilter.textContent,
    searchByTags: searchFilter.tags,
  });

  const linkView = {
    [ViewMode.Card]: CardView,
    [ViewMode.List]: ListView,
    [ViewMode.Masonry]: MasonryView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <LinkListOptions
          t={t}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          editMode={editMode}
          setEditMode={setEditMode}
        >
          <PageHeader icon={"bi-search"} title={"Search Results"} />
        </LinkListOptions>

        {!isLoading && !links[0] ? (
          <p>{t("nothing_found")}</p>
        ) : links[0] ? (
          <LinkComponent
            editMode={editMode}
            links={links}
            isLoading={isLoading}
          />
        ) : (
          isLoading && (
            <GridLoader
              color="oklch(var(--p))"
              loading={true}
              size={20}
              className="m-auto py-10"
            />
          )
        )}
      </div>
    </MainLayout>
  );
}

export { getServerSideProps };
