import MainLayout from "@/layouts/MainLayout";
import PageHeader from "@/components/PageHeader";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import { useTags } from "@linkwarden/router/tags";
import TagCard from "@/components/TagCard";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ReactElement, useEffect, useState } from "react";
import NewTagModal from "@/components/ModalContent/NewTagModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BulkDeleteTagsModal from "@/components/ModalContent/BulkDeleteTagsModal";
import MergeTagsModal from "@/components/ModalContent/MergeTagsModal";
import { NextPageWithLayout } from "../_app";
import { TagSort } from "@linkwarden/types/global";
import { useInView } from "react-intersection-observer";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<TagSort>(TagSort.DateNewestFirst);
  const { ref, inView } = useInView();
  const {
    data: tags = [],
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTags(undefined, {
    sort: sortBy,
  });

  const [newTagModal, setNewTagModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [mergeTagsModal, setMergeTagsModal] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    if (!inView) return;
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;

    fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="p-3 flex flex-col gap-5 w-full flex-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <PageHeader icon={"bi-hash"} title={t("tags")} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNewTagModal(true)}
                >
                  <i className="bi-plus-lg text-xl text-neutral"></i>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t("new_tag")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditMode(!editMode);
              setSelectedTags([]);
            }}
            className={editMode ? "bg-primary/20 hover:bg-primary/20" : ""}
          >
            <i className="bi-pencil-fill text-neutral text-xl" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <i className="bi-chevron-expand text-neutral text-xl"></i>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent sideOffset={4} align="end">
              <DropdownMenuRadioGroup
                value={sortBy.toString()}
                onValueChange={(v) => setSortBy(Number(v) as TagSort)}
              >
                <DropdownMenuRadioItem
                  value={TagSort.DateNewestFirst.toString()}
                >
                  {t("date_newest_first")}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value={TagSort.DateOldestFirst.toString()}
                >
                  {t("date_oldest_first")}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value={TagSort.NameAZ.toString()}>
                  {t("name_az")}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value={TagSort.NameZA.toString()}>
                  {t("name_za")}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value={TagSort.LinkCountHighLow.toString()}
                >
                  {t("link_count_high_low")}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem
                  value={TagSort.LinkCountLowHigh.toString()}
                >
                  {t("link_count_low_high")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {tags && editMode && tags.length > 0 && (
        <div className="w-full flex justify-between items-center min-h-[32px]">
          <div className="flex gap-3 ml-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              onChange={() => {
                if (selectedTags.length === tags.length) setSelectedTags([]);
                else setSelectedTags(tags.map((t) => t.id));
              }}
              checked={selectedTags.length === tags.length && tags.length > 0}
            />
            {selectedTags.length > 0 ? (
              <span>
                {selectedTags.length === 1
                  ? t("tag_selected")
                  : t("tags_selected", { count: selectedTags.length })}
              </span>
            ) : (
              <span>{t("nothing_selected")}</span>
            )}
          </div>
          <div className="flex gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      setMergeTagsModal(true);
                    }}
                    variant="ghost"
                    size="icon"
                    disabled={selectedTags.length < 2}
                  >
                    <i className="bi-intersect" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("merge_tags")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      setBulkDeleteModal(true);
                    }}
                    variant="ghost"
                    size="icon"
                    disabled={selectedTags.length === 0}
                  >
                    <i className="bi-trash text-error" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p> {t("delete")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      <div className="grid 2xl:grid-cols-6 xl:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-3">
        {tags.map((tag: any) => (
          <TagCard
            key={tag.id}
            tag={tag}
            selected={selectedTags.includes(tag.id)}
            editMode={editMode}
            onSelect={(id: number) => {
              console.log(id);
              if (selectedTags.includes(id))
                setSelectedTags((prev) => prev.filter((t) => t !== id));
              else setSelectedTags((prev) => [...prev, id]);
            }}
          />
        ))}
        {isLoading && !tags.length && <TagCardSkeleton />}
        {isFetchingNextPage && <TagCardSkeleton />}
      </div>

      {hasNextPage && <div ref={ref} className="h-1 w-full" />}

      {!isLoading && tags && !tags[0] && (
        <div
          style={{ flex: "1 1 auto" }}
          className="flex flex-col gap-2 justify-center h-full w-full mx-auto p-10"
        >
          <p className="text-center text-xl">{t("create_your_first_tag")}</p>
          <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
            {t("create_your_first_tag_desc")}
          </p>
          <Button
            className="mx-auto mt-5"
            variant={"accent"}
            onClick={() => setNewTagModal(true)}
          >
            <i className="bi-plus-lg text-xl mr-2" />
            {t("new_tag")}
          </Button>
        </div>
      )}

      {newTagModal && <NewTagModal onClose={() => setNewTagModal(false)} />}
      {bulkDeleteModal && (
        <BulkDeleteTagsModal
          onClose={() => {
            setBulkDeleteModal(false);
            setEditMode(false);
          }}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      )}
      {mergeTagsModal && (
        <MergeTagsModal
          onClose={() => {
            setMergeTagsModal(false);
            setEditMode(false);
          }}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      )}
    </div>
  );
};

Page.getLayout = function getLayout(page: ReactElement<any>) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;

export { getServerSideProps };

const TagCardSkeleton = () => {
  return (
    <div className="rounded-xl p-2">
      <div className="flex gap-3 flex-col">
        <div className="skeleton h-5 w-3/4"></div>
        <div className="flex justify-between items-center mt-auto">
          <div className="skeleton h-4 w-24"></div>
        </div>
      </div>
    </div>
  );
};
