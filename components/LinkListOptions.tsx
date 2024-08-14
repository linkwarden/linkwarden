import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import FilterSearchDropdown from "./FilterSearchDropdown";
import SortDropdown from "./SortDropdown";
import ViewDropdown from "./ViewDropdown";
import { TFunction } from "i18next";
import BulkDeleteLinksModal from "./ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "./ModalContent/BulkEditLinksModal";
import useCollectivePermissions from "@/hooks/useCollectivePermissions";
import { useRouter } from "next/router";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { useBulkDeleteLinks, useLinks } from "@/hooks/store/links";
import toast from "react-hot-toast";

type Props = {
  children: React.ReactNode;
  t: TFunction<"translation", undefined>;
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  searchFilter?: {
    name: boolean;
    url: boolean;
    description: boolean;
    tags: boolean;
    textContent: boolean;
  };
  setSearchFilter?: (filter: {
    name: boolean;
    url: boolean;
    description: boolean;
    tags: boolean;
    textContent: boolean;
  }) => void;
  sortBy: Sort;
  setSortBy: Dispatch<SetStateAction<Sort>>;
  editMode?: boolean;
  setEditMode?: (mode: boolean) => void;
};

const LinkListOptions = ({
  children,
  t,
  viewMode,
  setViewMode,
  searchFilter,
  setSearchFilter,
  sortBy,
  setSortBy,
  editMode,
  setEditMode,
}: Props) => {
  const { selectedLinks, setSelectedLinks } = useLinkStore();

  const deleteLinksById = useBulkDeleteLinks();

  const { links } = useLinks();

  const router = useRouter();

  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState(false);
  const [bulkEditLinksModal, setBulkEditLinksModal] = useState(false);

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
            toast.success(t("deleted"));
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
                <div
                  role="button"
                  onClick={() => {
                    setEditMode(!editMode);
                    setSelectedLinks([]);
                  }}
                  className={`btn btn-square btn-sm btn-ghost ${
                    editMode
                      ? "bg-primary/20 hover:bg-primary/20"
                      : "hover:bg-neutral/20"
                  }`}
                >
                  <i className="bi-pencil-fill text-neutral text-xl"></i>
                </div>
              )}
            {searchFilter && setSearchFilter && (
              <FilterSearchDropdown
                searchFilter={searchFilter}
                setSearchFilter={setSearchFilter}
              />
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
            <button
              onClick={() => setBulkEditLinksModal(true)}
              className="btn btn-sm btn-accent text-white w-fit ml-auto"
              disabled={
                selectedLinks.length === 0 ||
                !(
                  collectivePermissions === true ||
                  collectivePermissions?.canUpdate
                )
              }
            >
              {t("edit")}
            </button>
            <button
              onClick={(e) => {
                (document?.activeElement as HTMLElement)?.blur();
                e.shiftKey ? bulkDeleteLinks() : setBulkDeleteLinksModal(true);
              }}
              className="btn btn-sm bg-red-500 hover:bg-red-400 text-white w-fit ml-auto"
              disabled={
                selectedLinks.length === 0 ||
                !(
                  collectivePermissions === true ||
                  collectivePermissions?.canDelete
                )
              }
            >
              {t("delete")}
            </button>
          </div>
        </div>
      )}

      {bulkDeleteLinksModal && (
        <BulkDeleteLinksModal
          onClose={() => {
            setBulkDeleteLinksModal(false);
          }}
        />
      )}

      {bulkEditLinksModal && (
        <BulkEditLinksModal
          onClose={() => {
            setBulkEditLinksModal(false);
          }}
        />
      )}
    </>
  );
};

export default LinkListOptions;
