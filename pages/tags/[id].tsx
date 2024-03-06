import useLinkStore from "@/store/links";
import { useRouter } from "next/router";
import { FormEvent, use, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import useTagStore from "@/store/tags";
import SortDropdown from "@/components/SortDropdown";
import { Sort, TagIncludingLinkCount, ViewMode } from "@/types/global";
import useLinks from "@/hooks/useLinks";
import { toast } from "react-hot-toast";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
// import GridView from "@/components/LinkViews/Layouts/GridView";
import ListView from "@/components/LinkViews/Layouts/ListView";
import { dropdownTriggerer } from "@/lib/client/utils";
import BulkDeleteLinksModal from "@/components/ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "@/components/ModalContent/BulkEditLinksModal";
import useCollectivePermissions from "@/hooks/useCollectivePermissions";

export default function Index() {
  const router = useRouter();

  const { links, selectedLinks, deleteLinksById, setSelectedLinks } =
    useLinkStore();
  const { tags, updateTag, removeTag } = useTagStore();

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [renameTag, setRenameTag] = useState(false);
  const [newTagName, setNewTagName] = useState<string>();

  const [activeTag, setActiveTag] = useState<TagIncludingLinkCount>();

  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState(false);
  const [bulkEditLinksModal, setBulkEditLinksModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const collectivePermissions = useCollectivePermissions(
    selectedLinks.map((link) => link.collectionId as number)
  );

  useLinks({ tagId: Number(router.query.id), sort: sortBy });

  useEffect(() => {
    const tag = tags.find((e) => e.id === Number(router.query.id));

    if (tags.length > 0 && !tag?.id) {
      router.push("/dashboard");
      return;
    }

    setActiveTag(tag);
  }, [router, tags, Number(router.query.id), setActiveTag]);

  useEffect(() => {
    setNewTagName(activeTag?.name);
  }, [activeTag]);

  const [submitLoader, setSubmitLoader] = useState(false);

  const cancelUpdateTag = async () => {
    setNewTagName(activeTag?.name);
    setRenameTag(false);
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();

    if (activeTag?.name === newTagName) return setRenameTag(false);
    else if (newTagName === "") {
      return cancelUpdateTag();
    }

    setSubmitLoader(true);

    const load = toast.loading("Applying...");

    let response;

    if (activeTag && newTagName)
      response = await updateTag({
        ...activeTag,
        name: newTagName,
      });

    toast.dismiss(load);

    if (response?.ok) {
      toast.success("Tag Renamed!");
    } else toast.error(response?.data as string);
    setSubmitLoader(false);
    setRenameTag(false);
  };

  const remove = async () => {
    setSubmitLoader(true);

    const load = toast.loading("Applying...");

    let response;

    if (activeTag?.id) response = await removeTag(activeTag?.id);

    toast.dismiss(load);

    if (response?.ok) {
      toast.success("Tag Removed.");
      router.push("/links");
    } else toast.error(response?.data as string);
    setSubmitLoader(false);
    setRenameTag(false);
  };

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

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );

  const linkView = {
    [ViewMode.Card]: CardView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-center font-thin">
              <i className={"bi-hash text-primary text-3xl"} />

              {renameTag ? (
                <>
                  <form onSubmit={submit} className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      className="sm:text-4xl text-3xl capitalize bg-transparent h-10 w-3/4 outline-none border-b border-b-neutral-content"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <div
                      onClick={() => submit()}
                      id="expand-dropdown"
                      className="btn btn-ghost btn-square btn-sm"
                    >
                      <i className={"bi-check text-neutral text-2xl"}></i>
                    </div>
                    <div
                      onClick={() => cancelUpdateTag()}
                      id="expand-dropdown"
                      className="btn btn-ghost btn-square btn-sm"
                    >
                      <i className={"bi-x text-neutral text-2xl"}></i>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <p className="sm:text-4xl text-3xl capitalize">
                    {activeTag?.name}
                  </p>
                  <div className="relative">
                    <div
                      className={`dropdown dropdown-bottom font-normal ${
                        activeTag?.name.length && activeTag?.name.length > 8
                          ? "dropdown-end"
                          : ""
                      }`}
                    >
                      <div
                        tabIndex={0}
                        role="button"
                        onMouseDown={dropdownTriggerer}
                        className="btn btn-ghost btn-sm btn-square text-neutral"
                      >
                        <i
                          className={"bi-three-dots text-neutral text-2xl"}
                        ></i>
                      </div>
                      <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box w-36 mt-1">
                        <li>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              (document?.activeElement as HTMLElement)?.blur();
                              setRenameTag(true);
                            }}
                          >
                            Rename Tag
                          </div>
                        </li>
                        <li>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              (document?.activeElement as HTMLElement)?.blur();
                              remove();
                            }}
                          >
                            Remove Tag
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center mt-2">
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
        <LinkComponent
          editMode={editMode}
          links={links.filter((e) =>
            e.tags.some((e) => e.id === Number(router.query.id))
          )}
        />
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
