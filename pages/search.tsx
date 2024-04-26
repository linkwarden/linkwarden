import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import { Sort, ViewMode } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import PageHeader from "@/components/PageHeader";
import { GridLoader } from "react-spinners";
import useCollectivePermissions from "@/hooks/useCollectivePermissions";
import toast from "react-hot-toast";
import BulkDeleteLinksModal from "@/components/ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "@/components/ModalContent/BulkEditLinksModal";
import MasonryView from "@/components/LinkViews/Layouts/MasonryView";

export default function Search() {
  const { links, selectedLinks, setSelectedLinks, deleteLinksById } =
    useLinkStore();

  const router = useRouter();

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    tags: true,
    textContent: false,
  });

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState(false);
  const [bulkEditLinksModal, setBulkEditLinksModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
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
    const load = toast.loading(
      `Deleting ${selectedLinks.length} Link${
        selectedLinks.length > 1 ? "s" : ""
      }...`
    );

    const response = await deleteLinksById(
      selectedLinks.map((link) => link.id as number)
    );

    toast.dismiss(load);

    response.ok &&
      toast.success(
        `Deleted ${selectedLinks.length} Link${
          selectedLinks.length > 1 ? "s" : ""
        }!`
      );
  };

  const { isLoading } = useLinks({
    sort: sortBy,
    searchQueryString: decodeURIComponent(router.query.q as string),
    searchByName: searchFilter.name,
    searchByUrl: searchFilter.url,
    searchByDescription: searchFilter.description,
    searchByTextContent: searchFilter.textContent,
    searchByTags: searchFilter.tags,
  });

  useEffect(() => {
    console.log("isLoading", isLoading);
  }, [isLoading]);

  const linkView = {
    [ViewMode.Card]: CardView,
    [ViewMode.List]: ListView,
    [ViewMode.Masonry]: MasonryView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <PageHeader icon={"bi-search"} title={"Search Results"} />

          <div className="flex gap-3 items-center justify-end">
            <div className="flex gap-2 items-center mt-2">
              {links.length > 0 && (
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
              <FilterSearchDropdown
                searchFilter={searchFilter}
                setSearchFilter={setSearchFilter}
              />
              <SortDropdown sortBy={sortBy} setSort={setSortBy} />
              <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
            </div>
          </div>
        </div>

        {editMode && links.length > 0 && (
          <div className="w-full flex justify-between items-center min-h-[32px]">
            {links.length > 0 && (
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
                    {selectedLinks.length}{" "}
                    {selectedLinks.length === 1 ? "link" : "links"} selected
                  </span>
                ) : (
                  <span>Nothing selected</span>
                )}
              </div>
            )}
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
                Edit
              </button>
              <button
                onClick={(e) => {
                  (document?.activeElement as HTMLElement)?.blur();
                  e.shiftKey
                    ? bulkDeleteLinks()
                    : setBulkDeleteLinksModal(true);
                }}
                className="btn btn-sm bg-red-400 border-red-400 hover:border-red-500 hover:bg-red-500 text-white w-fit ml-auto"
                disabled={
                  selectedLinks.length === 0 ||
                  !(
                    collectivePermissions === true ||
                    collectivePermissions?.canDelete
                  )
                }
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {!isLoading && !links[0] ? (
          <p>
            Nothing found.{" "}
            <span className="font-bold text-xl" title="Shruggie">
              ¯\_(ツ)_/¯
            </span>
          </p>
        ) : links[0] ? (
          <LinkComponent
            editMode={editMode}
            links={links}
            isLoading={isLoading}
          />
        ) : (
          isLoading && (
            <GridLoader
              color="oklch(var(--p))"
              loading={true}
              size={20}
              className="m-auto py-10"
            />
          )
        )}
      </div>
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
    </MainLayout>
  );
}
