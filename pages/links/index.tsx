import NoLinksFound from "@/components/NoLinksFound";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Sort, ViewMode } from "@/types/global";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import { useRouter } from "next/router";
import MasonryView from "@/components/LinkViews/Layouts/MasonryView";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";

export default function Links() {
  const { t } = useTranslation();
  const { links } = useLinkStore();

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const router = useRouter();

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  useLinks({ sort: sortBy });

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
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          editMode={editMode}
          setEditMode={setEditMode}
        >
          <PageHeader
            icon={"bi-link-45deg"}
            title={t("all_links")}
            description={t("all_links_desc")}
          />
        </LinkListOptions>

        {links[0] ? (
          <LinkComponent editMode={editMode} links={links} />
        ) : (
          <NoLinksFound text={t("you_have_not_added_any_links")} />
        )}
      </div>
    </MainLayout>
  );
}

export { getServerSideProps };
