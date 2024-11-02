import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Sort, TagIncludingLinkCount, ViewMode } from "@/types/global";
import { useLinks } from "@/hooks/store/links";
import { dropdownTriggerer } from "@/lib/client/utils";
import BulkDeleteLinksModal from "@/components/ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "@/components/ModalContent/BulkEditLinksModal";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import LinkListOptions from "@/components/LinkListOptions";
import { useRemoveTag, useTags, useUpdateTag } from "@/hooks/store/tags";
import Links from "@/components/LinkViews/Links";
import toast from "react-hot-toast";

export default function Index() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: tags = [] } = useTags();
  const updateTag = useUpdateTag();
  const removeTag = useRemoveTag();

  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const [renameTag, setRenameTag] = useState(false);
  const [newTagName, setNewTagName] = useState<string>();

  const [activeTag, setActiveTag] = useState<TagIncludingLinkCount>();

  const [bulkDeleteLinksModal, setBulkDeleteLinksModal] = useState(false);
  const [bulkEditLinksModal, setBulkEditLinksModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const { links, data } = useLinks({
    sort: sortBy,
    tagId: Number(router.query.id),
  });

  useEffect(() => {
    const tag = tags.find((e: any) => e.id === Number(router.query.id));

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

    if (activeTag && newTagName) {
      const load = toast.loading(t("applying_changes"));

      await updateTag.mutateAsync(
        {
          ...activeTag,
          name: newTagName,
        },
        {
          onSettled: (data, error) => {
            setSubmitLoader(false);
            toast.dismiss(load);

            if (error) {
              toast.error(error.message);
            } else {
              toast.success(t("tag_renamed"));
            }
          },
        }
      );
    }

    setRenameTag(false);
  };

  const remove = async () => {
    setSubmitLoader(true);

    if (activeTag?.id) {
      const load = toast.loading(t("applying_changes"));

      await removeTag.mutateAsync(activeTag?.id, {
        onSettled: (data, error) => {
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            toast.success(t("tag_deleted"));
            router.push("/links");
          }
        },
      });
    }

    setSubmitLoader(false);
    setRenameTag(false);
  };

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <LinkListOptions
          t={t}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          editMode={editMode}
          setEditMode={setEditMode}
        >
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-center font-thin">
              <i className={"bi-hash text-primary text-3xl"} />

              {renameTag ? (
                <form onSubmit={submit} className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    className="sm:text-3xl text-2xl bg-transparent h-10 w-3/4 outline-none border-b border-b-neutral-content"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <div
                    onClick={() => submit()}
                    id="expand-dropdown"
                    className="btn btn-ghost btn-square btn-sm"
                  >
                    <i className={"bi-check2 text-neutral text-2xl"}></i>
                  </div>
                  <div
                    onClick={() => cancelUpdateTag()}
                    id="expand-dropdown"
                    className="btn btn-ghost btn-square btn-sm"
                  >
                    <i className={"bi-x text-neutral text-2xl"}></i>
                  </div>
                </form>
              ) : (
                <>
                  <p className="sm:text-3xl text-2xl capitalize">
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
                      <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box mt-1">
                        <li>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              (document?.activeElement as HTMLElement)?.blur();
                              setRenameTag(true);
                            }}
                            className="whitespace-nowrap"
                          >
                            {t("rename_tag")}
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
                            className="whitespace-nowrap"
                          >
                            {t("delete_tag")}
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </LinkListOptions>

        <Links
          editMode={editMode}
          links={links}
          layout={viewMode}
          placeholderCount={1}
          useData={data}
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

export { getServerSideProps };
