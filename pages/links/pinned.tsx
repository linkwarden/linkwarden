import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { faThumbTack } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import ViewDropdown from "@/components/ViewDropdown";
import DefaultView from "@/components/LinkViews/DefaultView";
import GridView from "@/components/LinkViews/GridView";
import ListView from "@/components/LinkViews/ListView";

export default function PinnedLinks() {
  const { links } = useLinkStore();

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Default
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy, pinnedOnly: true });

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
              icon={faThumbTack}
              className="sm:w-10 sm:h-10 w-8 h-8 text-primary drop-shadow"
            />
            <div>
              <p className="text-3xl capitalize font-thin">Pinned Links</p>

              <p className="sm:text-sm text-xs">
                Pinned Links from your Collections
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center mt-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
        {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
          <LinkComponent links={links} />
        ) : (
          <div
            style={{ flex: "1 1 auto" }}
            className="sky-shadow flex flex-col justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-2xl bg-base-200"
          >
            <p className="text-center text-2xl">
              Pin Your Favorite Links Here!
            </p>
            <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm mt-2">
              You can Pin your favorite Links by clicking on the three dots on
              each Link and clicking{" "}
              <span className="font-semibold">Pin to Dashboard</span>.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
