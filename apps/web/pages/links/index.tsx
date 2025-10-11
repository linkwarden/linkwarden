import NoLinksFound from "@/components/NoLinksFound";
import { useLinks } from "@linkwarden/router/links";
import MainLayout from "@/layouts/MainLayout";
import React, { useEffect, useState } from "react";
import {
  LinkIncludingShortenedCollectionAndTags,
  Sort,
  ViewMode,
} from "@linkwarden/types";
import { useRouter } from "next/router";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import Links from "@/components/LinkViews/Links";
import clsx from "clsx";
import DragNDrop from "@/components/DragNDrop";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "@linkwarden/lib";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Index() {
  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const { links, refetch, isRefetching, data } = useLinks({
    sort: sortBy,
  });

  const router = useRouter();

  const [editMode, setEditMode] = useState(false);

  const handleRefreshLinks = () => {
    if (isRefetching) return;
    refetch();
  };

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  return (
    <DragNDrop
      links={links}
      activeLink={activeLink}
      setActiveLink={setActiveLink}
    >
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
            links={links}
          >
            <div className={clsx("flex items-center gap-3")}>
              <i
                className={`bi-link-45deg text-primary text-3xl drop-shadow`}
              ></i>
              <div>
                <div className="flex gap-2 items-center">
                  <p className="text-2xl capitalize font-thin">
                    {t("all_links")}
                  </p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <ArrowsClockwise
                          className={cn(
                            "cursor-pointer",
                            isRefetching ? "opacity-50" : ""
                          )}
                          onClick={handleRefreshLinks}
                        />
                      </TooltipTrigger>
                      <TooltipContent>Refresh</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <p className="text-xs sm:text-sm">{t("all_links_desc")}</p>
              </div>
            </div>
          </LinkListOptions>

          {!data.isLoading && links && !links[0] && (
            <NoLinksFound text={t("you_have_not_added_any_links")} />
          )}
          <Links
            editMode={editMode}
            links={links}
            layout={viewMode}
            placeholderCount={1}
            useData={data}
          />
        </div>
      </MainLayout>
    </DragNDrop>
  );
}

export { getServerSideProps };
