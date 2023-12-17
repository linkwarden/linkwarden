import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import NoLinksFound from "@/components/NoLinksFound";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import ViewDropdown from "@/components/ViewDropdown";
import DefaultView from "@/components/LinkViews/DefaultView";
import GridView from "@/components/LinkViews/GridView";
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
        <div className="flex gap-3 justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faLink}
              className="sm:w-10 sm:h-10 w-8 h-8 text-primary drop-shadow"
            />
            <div>
              <p className="text-3xl capitalize font-thin">All Links</p>

              <p className="sm:text-sm text-xs">Links from every Collections</p>
            </div>
          </div>

          <div className="flex gap-2 items-center mt-2">
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
