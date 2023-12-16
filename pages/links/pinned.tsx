import LinkCard from "@/components/LinkCard";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort } from "@/types/global";
import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function PinnedLinks() {
  const { links } = useLinkStore();

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy, pinnedOnly: true });

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <PageHeader
          icon={"bi-pin-angle"}
          title={"Pinned Links"}
          description={"Pinned Links from your Collections"}
        />
        <div className="flex gap-3 justify-end">
          <div className="relative mt-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
          </div>
        </div>
        {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
          <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
            {links.map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
          </div>
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
