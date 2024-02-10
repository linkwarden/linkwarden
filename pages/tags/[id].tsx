import useLinkStore from "@/store/links";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
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

export default function Index() {
  const router = useRouter();

  const { links } = useLinkStore();
  const { tags, updateTag, removeTag } = useTagStore();

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [renameTag, setRenameTag] = useState(false);
  const [newTagName, setNewTagName] = useState<string>();

  const [activeTag, setActiveTag] = useState<TagIncludingLinkCount>();

  useLinks({ tagId: Number(router.query.id), sort: sortBy });

  useEffect(() => {
    setActiveTag(tags.find((e) => e.id === Number(router.query.id)));
  }, [router, tags]);

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
                      className={`dropdown dropdown-bottom font-normal ${activeTag?.name.length && activeTag?.name.length > 8
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
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
        <LinkComponent
          showCheckbox={false}
          links={links.filter((e) =>
            e.tags.some((e) => e.id === Number(router.query.id))
          )}
        />
      </div>
    </MainLayout>
  );
}
