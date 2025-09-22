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
import { useMemo, useState } from "react";
import NewTagModal from "@/components/ModalContent/NewTagModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BulkDeleteTagsModal from "@/components/ModalContent/BulkDeleteTagsModal";
import MergeTagsModal from "@/components/ModalContent/MergeTagsModal";

enum TagSort {
  DateNewestFirst = 0,
  DateOldestFirst = 1,
  NameAZ = 2,
  NameZA = 3,
  LinkCountHighLow = 4,
  LinkCountLowHigh = 5,
}

export default function Tags() {
  const { t } = useTranslation();
  const { data: tags = [], isLoading } = useTags();

  const [sortBy, setSortBy] = useState<TagSort>(TagSort.DateNewestFirst);
  const [newTagModal, setNewTagModal] = useState(false);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [mergeTagsModal, setMergeTagsModal] = useState(false);

  const tagTime = (tag: any) => {
    if (tag?.createdAt) return new Date(tag.createdAt as string).getTime();
    return typeof tag?.id === "number" ? tag.id : 0;
  };
  const linkCount = (tag: any) =>
    tag?.linkCount ?? tag?.linksCount ?? tag?._count?.links ?? 0;

  const compare = useMemo(() => {
    switch (sortBy) {
      case TagSort.NameAZ:
        return (a: any, b: any) => (a?.name ?? "").localeCompare(b?.name ?? "");
      case TagSort.NameZA:
        return (a: any, b: any) => (b?.name ?? "").localeCompare(a?.name ?? "");
      case TagSort.DateOldestFirst:
        return (a: any, b: any) => tagTime(a) - tagTime(b);
      case TagSort.LinkCountHighLow:
        return (a: any, b: any) => linkCount(b) - linkCount(a);
      case TagSort.LinkCountLowHigh:
        return (a: any, b: any) => linkCount(a) - linkCount(b);
      case TagSort.DateNewestFirst:
      default:
        return (a: any, b: any) => tagTime(b) - tagTime(a);
    }
  }, [sortBy]);

  const sortedTags = useMemo(() => tags.slice().sort(compare), [tags, compare]);

  const [editMode, setEditMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
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

        <div className="grid 2xl:grid-cols-6 xl:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-5">
          {sortedTags.map((tag: any) => (
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
        </div>

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
      </div>

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
    </MainLayout>
  );
}

export { getServerSideProps };
