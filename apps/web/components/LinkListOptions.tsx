import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import SortDropdown from "./SortDropdown";
import ViewDropdown from "./ViewDropdown";
import { TFunction } from "i18next";
import BulkDeleteLinksModal from "./ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "./ModalContent/BulkEditLinksModal";
import useCollectivePermissions from "@/hooks/useCollectivePermissions";
import { useRouter } from "next/router";
import useLinkStore from "@/store/links";
import {
  LinkIncludingShortenedCollectionAndTags,
  Sort,
  ViewMode,
} from "@linkwarden/types";
import { useArchiveAction, useBulkDeleteLinks } from "@linkwarden/router/links";
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
  setSortBy: Dispatch<SetStateAction<Sort>>;
  editMode?: boolean;
  setEditMode?: (mode: boolean) => void;
  links: LinkIncludingShortenedCollectionAndTags[];
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
}: Props) => {
  const { selectedLinks, setSelectedLinks } = useLinkStore();

  const deleteLinksById = useBulkDeleteLinks();
  const refreshPreservations = useArchiveAction();

  const router = useRouter();

  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState(false);
  const [bulkEditLinksModal, setBulkEditLinksModal] = useState(false);
  const [bulkRefreshPreservationsModal, setBulkRefreshPreservationsModal] =
    useState(false);

  useEffect(() => {
    if (editMode && setEditMode) return setEditMode(false);
  }, [router]);

  const collectivePermissions = useCollectivePermissions(
    selectedLinks.map((link) => link.collectionId as number)
  );

  const handleSelectAll = () => {
    if (selectedLinks.length === links.length) {
      setSelectedLinks([]);
    } else {
      setSelectedLinks(links.map((link) => link));
    }
  };

  const bulkDeleteLinks = async () => {
    const load = toast.loading(t("deleting"));

    await deleteLinksById.mutateAsync(
      selectedLinks.map((link) => link.id as number),
      {
        onSettled: (data, error) => {
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            setSelectedLinks([]);
            setEditMode?.(false);
            toast.success(t("deleted"));
          }
        },
      }
    );
  };

  const bulkRefreshPreservations = async () => {
    const load = toast.loading(t("sending_request"));

    await refreshPreservations.mutateAsync(
      {
        linkIds: selectedLinks.map((link) => link.id as number),
      },
      {
        onSettled: (data, error) => {
          toast.dismiss(load);
          if (error) {
            toast.error(error.message);
          } else {
            setSelectedLinks([]);
            setEditMode?.(false);
            toast.success(t("links_being_archived"));
          }
        },
      }
    );
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
                    setSelectedLinks([]);
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
              checked={
                selectedLinks.length === links.length && links.length > 0
              }
            />
            {selectedLinks.length > 0 ? (
              <span>
                {selectedLinks.length === 1
                  ? t("link_selected")
                  : t("links_selected", { count: selectedLinks.length })}
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
                    disabled={selectedLinks.length === 0}
                  >
                    <i className="bi-arrow-clockwise" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("refresh_preserved_formats")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setBulkEditLinksModal(true)}
                    variant="ghost"
                    size="icon"
                    disabled={
                      selectedLinks.length === 0 ||
                      !(
                        collectivePermissions === true ||
                        collectivePermissions?.canUpdate
                      )
                    }
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
                    disabled={
                      selectedLinks.length === 0 ||
                      !(
                        collectivePermissions === true ||
                        collectivePermissions?.canDelete
                      )
                    }
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
            {selectedLinks.length === 1
              ? t("refresh_preserved_formats_confirmation_desc")
              : t("refresh_multiple_preserved_formats_confirmation_desc", {
                  count: selectedLinks.length,
                })}
          </p>
        </ConfirmationModal>
      )}
    </>
  );
};

export default LinkListOptions;
