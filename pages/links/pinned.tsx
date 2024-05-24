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
import { useRouter } from "next/router";
import MasonryView from "@/components/LinkViews/Layouts/MasonryView";

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
    [ViewMode.List]: ListView,
    [ViewMode.Masonry]: MasonryView,
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
                className="btn btn-sm bg-red-500 hover:bg-red-400 text-white w-fit ml-auto"
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
            className="flex flex-col gap-2 justify-center h-full w-full mx-auto p-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-1/4 min-w-[7rem] max-w-[15rem] h-auto mx-auto mb-5 text-primary drop-shadow"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A6 6 0 0 1 5 6.708V2.277a3 3 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354m1.58 1.408-.002-.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a5 5 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a5 5 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.8 1.8 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14q.091.15.214.271a1.8 1.8 0 0 0 .37.282" />
            </svg>
            <p className="text-center text-2xl">
              Pin Your Favorite Links Here!
            </p>
            <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
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
