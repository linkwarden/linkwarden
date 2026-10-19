import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import SortDropdown from "./SortDropdown";
import ViewDropdown from "./ViewDropdown";
import { TFunction } from "i18next";
import BulkDeleteLinksModal from "./ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "./ModalContent/BulkEditLinksModal";
import { useRouter } from "next/router";
import useLinkStore from "@/store/links";
import {
  LinkIncludingShortenedCollectionAndTags,
  ReadingListStatus,
  Sort,
  ViewMode,
} from "@linkwarden/types/global";
import { useArchiveAction, useBulkDeleteLinks } from "@linkwarden/router/links";
import useSetReadingListStatus from "@/lib/client/readingList";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ConfirmationModal from "./ConfirmationModal";

type Props = {
  children: React.ReactNode;
  t: TFunction<"translation", undefined>;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  sortBy: Sort;
  setSortBy: (sort: Sort) => void;
  editMode?: boolean;
  setEditMode?: (mode: boolean) => void;
  links: LinkIncludingShortenedCollectionAndTags[];
  allowCustomOrder?: boolean;
};

const LinkListOptions = ({
  children,
  t,
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  editMode,
  setEditMode,
  links,
  allowCustomOrder,
}: Props) => {
  const { selectedIds, setSelected, clearSelected, selectionCount } =
    useLinkStore();

  const deleteLinksById = useBulkDeleteLinks();
  const refreshPreservations = useArchiveAction();
  const setReadingListStatus = useSetReadingListStatus();

  const router = useRouter();

  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState(false);
  const [bulkEditLinksModal, setBulkEditLinksModal] = useState(false);
  const [bulkRefreshPreservationsModal, setBulkRefreshPreservationsModal] =
    useState(false);

  useEffect(() => {
    if (editMode && setEditMode) return setEditMode(false);
  }, [router]);

  const handleSelectAll = () => {
    if (selectionCount === links.length) {
      clearSelected();
    } else {
      setSelected(links.map((link) => link.id as number));
    }
  };

  const bulkDeleteLinks = async () => {
    const load = toast.loading(t("deleting"));

    const ids = Object.keys(selectedIds).map(Number);

    await deleteLinksById.mutateAsync(ids, {
      onSettled: (data, error) => {
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          clearSelected();
          setEditMode?.(false);
          toast.success(t("deleted"));
        }
      },
    });
  };

  const bulkRefreshPreservations = async () => {
    const load = toast.loading(t("sending_request"));

    const ids = Object.keys(selectedIds).map(Number);

    await refreshPreservations.mutateAsync(
      {
        linkIds: ids,
      },
      {
        onSettled: (data, error) => {
          toast.dismiss(load);
          if (error) {
            toast.error(error.message);
          } else {
            clearSelected();
            setEditMode?.(false);
            toast.success(t("links_being_archived"));
          }
        },
      }
    );
  };

  const bulkSetReadingListStatus = async (status: ReadingListStatus | null) => {
    const ids = Object.keys(selectedIds).map(Number);

    if (await setReadingListStatus(ids, status)) {
      clearSelected();
      setEditMode?.(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        {children}

        <div className="flex gap-3 items-center justify-end">
          <div className="flex gap-2 items-center mt-2">
            {links &&
              links.length > 0 &&
              editMode !== undefined &&
              setEditMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditMode(!editMode);
                    clearSelected();
                  }}
                  className={
                    editMode ? "bg-primary/20 hover:bg-primary/20" : ""
                  }
                >
                  <i className="bi-pencil-fill text-neutral text-xl" />
                </Button>
              )}
            <SortDropdown
              sortBy={sortBy}
              setSort={(value) => {
                setSortBy(value);
              }}
              t={t}
              allowCustomOrder={allowCustomOrder}
            />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
      </div>

      {links && editMode && links.length > 0 && (
        <div className="w-full flex justify-between items-center min-h-[32px]">
          <div className="flex gap-3 ml-3">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              onChange={() => handleSelectAll()}
              checked={selectionCount === links.length && links.length > 0}
            />
            {selectionCount > 0 ? (
              <span>
                {selectionCount === 1
                  ? t("link_selected")
                  : t("links_selected", {
                      count: selectionCount,
                    })}
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
                    variant="ghost"
                    size="icon"
                    onClick={() => setBulkRefreshPreservationsModal(true)}
                    disabled={selectionCount === 0}
                  >
                    <i className="bi-arrow-clockwise" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("refresh_preserved_formats")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={selectionCount === 0}
                      >
                        <i className="bi-bookmark" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("reading_list")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => bulkSetReadingListStatus("unread")}
                >
                  <i className="bi-bookmark-plus" />
                  {t("add_to_reading_list")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => bulkSetReadingListStatus("read")}
                >
                  <i className="bi-bookmark-check" />
                  {t("mark_as_read")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => bulkSetReadingListStatus(null)}
                >
                  <i className="bi-bookmark-x" />
                  {t("remove_from_reading_list")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setBulkEditLinksModal(true)}
                    variant="ghost"
                    size="icon"
                    disabled={selectionCount === 0}
                  >
                    <i className="bi-pencil-square" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("edit")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.shiftKey
                        ? bulkDeleteLinks()
                        : setBulkDeleteLinksModal(true);
                    }}
                    variant="ghost"
                    size="icon"
                    disabled={selectionCount === 0}
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

      {bulkDeleteLinksModal && (
        <BulkDeleteLinksModal
          onClose={() => {
            setBulkDeleteLinksModal(false);
            setEditMode?.(false);
          }}
        />
      )}

      {bulkEditLinksModal && (
        <BulkEditLinksModal
          onClose={() => {
            setBulkEditLinksModal(false);
            setEditMode?.(false);
          }}
        />
      )}

      {bulkRefreshPreservationsModal && (
        <ConfirmationModal
          toggleModal={() => {
            setBulkRefreshPreservationsModal(false);
          }}
          onConfirmed={async () => {
            await bulkRefreshPreservations();
          }}
          title={t("refresh_preserved_formats")}
        >
          <p className="mb-5">
            {selectionCount === 1
              ? t("refresh_preserved_formats_confirmation_desc")
              : t("refresh_multiple_preserved_formats_confirmation_desc", {
                  count: selectionCount,
                })}
          </p>
        </ConfirmationModal>
      )}
    </>
  );
};

export default LinkListOptions;
