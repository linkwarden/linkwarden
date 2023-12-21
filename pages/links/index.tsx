import NoLinksFound from "@/components/NoLinksFound";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Sort, ViewMode } from "@/types/global";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
// import GridView from "@/components/LinkViews/Layouts/GridView";

export default function Links() {
  const { links } = useLinkStore();

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy });

  const linkView = {
    [ViewMode.Card]: CardView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <PageHeader
            icon={"bi-link-45deg"}
            title={"All Links"}
            description={"Links from every Collections"}
          />

          <div className="mt-2 flex items-center justify-end gap-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {links[0] ? (
          <LinkComponent links={links} />
        ) : (
          <NoLinksFound text="You Haven't Created Any Links Yet" />
        )}
      </div>
    </MainLayout>
  );
}
