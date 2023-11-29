import LinkCard from "@/components/LinkCard";
import useLinkStore from "@/store/links";
import {
  faCheck,
  faEllipsis,
  faHashtag,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import useTagStore from "@/store/tags";
import SortDropdown from "@/components/SortDropdown";
import { Sort, TagIncludingLinkCount } from "@/types/global";
import useLinks from "@/hooks/useLinks";
import Dropdown from "@/components/Dropdown";
import { toast } from "react-hot-toast";

export default function Index() {
  const router = useRouter();

  const { links } = useLinkStore();
  const { tags, updateTag, removeTag } = useTagStore();

  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [expandDropdown, setExpandDropdown] = useState(false);

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

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-end font-thin">
              <FontAwesomeIcon
                icon={faHashtag}
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-primary"
              />
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
                      <FontAwesomeIcon
                        icon={faCheck}
                        id="expand-dropdown"
                        className="w-5 h-5 text-neutral"
                      />
                    </div>
                    <div
                      onClick={() => cancelUpdateTag()}
                      id="expand-dropdown"
                      className="btn btn-ghost btn-square btn-sm"
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        id="expand-dropdown"
                        className="w-5 h-5 text-neutral"
                      />
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
                      onClick={() => setExpandDropdown(!expandDropdown)}
                      id="expand-dropdown"
                      className="btn btn-ghost btn-square btn-sm"
                    >
                      <FontAwesomeIcon
                        icon={faEllipsis}
                        id="expand-dropdown"
                        className="w-5 h-5 text-neutral"
                      />
                    </div>

                    {expandDropdown ? (
                      <Dropdown
                        items={[
                          {
                            name: "Rename Tag",
                            onClick: () => {
                              setRenameTag(true);
                              setExpandDropdown(false);
                            },
                          },
                          {
                            name: "Remove Tag",
                            onClick: () => {
                              remove();
                              setExpandDropdown(false);
                            },
                          },
                        ]}
                        onClickOutside={(e: Event) => {
                          const target = e.target as HTMLInputElement;
                          if (target.id !== "expand-dropdown")
                            setExpandDropdown(false);
                        }}
                        className="absolute top-8 left-0 w-36 font-normal"
                      />
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
          </div>
        </div>
        <div className="grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
          {links
            .filter((e) => e.tags.some((e) => e.id === Number(router.query.id)))
            .map((e, i) => {
              return <LinkCard key={i} link={e} count={i} />;
            })}
        </div>
      </div>
    </MainLayout>
  );
}
