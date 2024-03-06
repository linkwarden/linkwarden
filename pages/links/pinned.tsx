import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import MainLayout from "@/layouts/MainLayout";
import useLinkStore from "@/store/links";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Sort, ViewMode } from "@/types/global";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import BulkDeleteLinksModal from "@/components/ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "@/components/ModalContent/BulkEditLinksModal";
import useCollectivePermissions from "@/hooks/useCollectivePermissions";
import toast from "react-hot-toast";
// import GridView from "@/components/LinkViews/Layouts/GridView";
import { useRouter } from "next/router";

export default function PinnedLinks() {
  const { links, selectedLinks, deleteLinksById, setSelectedLinks } =
    useLinkStore();

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({ sort: sortBy, pinnedOnly: true });

  const router = useRouter();
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

  const linkView = {
    [ViewMode.Card]: CardView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <PageHeader
            icon={"bi-pin-angle"}
            title={"Pinned Links"}
            description={"Pinned Links from your Collections"}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            {!(links.length === 0) && (
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
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
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

        {links.some((e) => e.pinnedBy && e.pinnedBy[0]) ? (
          <LinkComponent editMode={editMode} links={links} />
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
