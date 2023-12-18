import NoLinksFound from "@/components/NoLinksFound";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Sort, ViewMode } from "@/types/global";
import ViewDropdown from "@/components/ViewDropdown";
import DefaultView from "@/components/LinkViews/DefaultView";
import ListView from "@/components/LinkViews/ListView";


export default function Links() {
  const { links } = useLinkStore();

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Default
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy });

  const linkView = {
    [ViewMode.Default]: DefaultView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <PageHeader
          icon={"bi-link-45deg"}
          title={"All Links"}
          description={"Links from every Collections"}
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <SortDropdown sortBy={sortBy} setSort={setSortBy}/>
          <ViewDropdown viewMode={viewMode} setViewMode={setViewMode}/>
        </div>

        {links[0] ? (
          <LinkComponent links={links}/>
        ) : (
          <NoLinksFound text="You Haven't Created Any Links Yet"/>
        )}
      </div>
    </MainLayout>
  );
}
