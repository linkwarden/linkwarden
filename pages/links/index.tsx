import LinkCard from "@/components/LinkCard";
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
import DefaultGridView from "@/components/LinkViews/DefaultGridView";
import CompactGridView from "@/components/LinkViews/CompactGridView";
import ListView from "@/components/LinkViews/ListView";

export default function Links() {
  const { links } = useLinkStore();

  const [viewMode, setViewMode] = useState<string>(localStorage.getItem('viewMode') || ViewMode.Default);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy });

  const components = {
    [ViewMode.Default]: DefaultGridView,
    [ViewMode.Compact]: CompactGridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const Component = components[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex gap-3 justify-between">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faLink}
              className="sm:w-10 sm:h-10 w-6 h-6 text-primary drop-shadow"
            />
            <div>
              <p className="text-3xl capitalize font-thin">All Links</p>

              <p>Links from every Collections</p>
            </div>
          </div>

          <div className="flex items-center mt-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
        {links[0] ? (
          <Component links={links} />
        ) : (
          <NoLinksFound text="You Haven't Created Any Links Yet" />
        )}
      </div>
    </MainLayout>
  );
}
