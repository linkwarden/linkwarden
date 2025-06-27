import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Sort, TagIncludingLinkCount, ViewMode } from "@linkwarden/types";
import { useLinks } from "@linkwarden/router/links";
import BulkDeleteLinksModal from "@/components/ModalContent/BulkDeleteLinksModal";
import BulkEditLinksModal from "@/components/ModalContent/BulkEditLinksModal";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import LinkListOptions from "@/components/LinkListOptions";
import { useRemoveTag, useTags, useUpdateTag } from "@linkwarden/router/tags";
import Links from "@/components/LinkViews/Links";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
          links={links}
        >
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-center font-thin">
              <i className="bi-hash text-primary text-3xl" />

              {renameTag ? (
                <form onSubmit={submit} className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    className="sm:text-3xl text-xl bg-transparent h-10 w-3/4 outline-none border-b border-b-neutral-content"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <Button variant="ghost" size="icon" onClick={submit}>
                    <i className="bi-check2 text-neutral text-xl" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={cancelUpdateTag}>
                    <i className="bi-x text-neutral text-xl" />
                  </Button>
                </form>
              ) : (
                <>
                  <p className="sm:text-3xl text-xl">{activeTag?.name}</p>
                  <div className="relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          title={t("more")}
                        >
                          <i className="bi-three-dots text-xl text-neutral" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        sideOffset={4}
                        align={
                          activeTag?.name.length && activeTag?.name.length > 8
                            ? "end"
                            : "start"
                        }
                        className="bg-base-200 border border-neutral-content rounded-box p-1"
                      >
                        <DropdownMenuItem onClick={() => setRenameTag(true)}>
                          <i className="bi-pencil-square" />
                          {t("rename_tag")}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={remove}
                          className="text-error"
                        >
                          <i className="bi-trash" />
                          {t("delete_tag")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        <BulkDeleteLinksModal onClose={() => setBulkDeleteLinksModal(false)} />
      )}
      {bulkEditLinksModal && (
        <BulkEditLinksModal onClose={() => setBulkEditLinksModal(false)} />
      )}
    </MainLayout>
  );
}

export { getServerSideProps };
