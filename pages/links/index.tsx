import LinkCard from "@/components/LinkCard";
import NoLinksFound from "@/components/NoLinksFound";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort } from "@/types/global";
import React, { useState } from "react";
import PageHeader from "@/components/PageHeader";

export default function Links() {
  const { links } = useLinkStore();

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy });

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <PageHeader
          icon={"bi-link-45deg"}
          title={"All Links"}
          description={"Links from every Collections"}
        />

        <div className="flex gap-3 justify-end">
          <div className="relative mt-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
          </div>
        </div>

        {links[0] ? (
          <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 grid-cols-1 gap-5">
            {links.map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
          </div>
        ) : (
          <NoLinksFound text="You Haven't Created Any Links Yet" />
        )}
      </div>
    </MainLayout>
  );
}
