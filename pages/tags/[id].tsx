import LinkCard from "@/components/LinkCard";
import useLinkStore from "@/store/links";
import {
  faCheck,
  faEllipsis,
  faHashtag,
  faSort,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Tag } from "@prisma/client";
import useTagStore from "@/store/tags";
import SortDropdown from "@/components/SortDropdown";
import { Sort } from "@/types/global";
import useLinks from "@/hooks/useLinks";
import Dropdown from "@/components/Dropdown";
import { toast } from "react-hot-toast";

export default function Index() {
  const router = useRouter();

  const { links } = useLinkStore();
  const { tags, updateTag, removeTag } = useTagStore();

  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [expandDropdown, setExpandDropdown] = useState(false);

  const [renameTag, setRenameTag] = useState(false);
  const [newTagName, setNewTagName] = useState<string>();

  const [activeTag, setActiveTag] = useState<Tag>();

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
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 dark:text-sky-500"
              />
              {renameTag ? (
                <>
                  <form onSubmit={submit} className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      className="sm:text-4xl text-3xl capitalize text-black dark:text-white bg-transparent h-10 w-3/4 outline-none border-b border-b-sky-100 dark:border-b-neutral-700"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <div
                      onClick={() => submit()}
                      id="expand-dropdown"
                      className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
                    >
                      <FontAwesomeIcon
                        icon={faCheck}
                        id="expand-dropdown"
                        className="w-5 h-5 text-gray-500 dark:text-gray-300"
                      />
                    </div>
                    <div
                      onClick={() => cancelUpdateTag()}
                      id="expand-dropdown"
                      className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        id="expand-dropdown"
                        className="w-5 h-5 text-gray-500 dark:text-gray-300"
                      />
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <p className="sm:text-4xl text-3xl capitalize text-black dark:text-white">
                    {activeTag?.name}
                  </p>
                  <div className="relative">
                    <div
                      onClick={() => setExpandDropdown(!expandDropdown)}
                      id="expand-dropdown"
                      className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
                    >
                      <FontAwesomeIcon
                        icon={faEllipsis}
                        id="expand-dropdown"
                        className="w-5 h-5 text-gray-500 dark:text-gray-300"
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
            <div
              onClick={() => setSortDropdown(!sortDropdown)}
              id="sort-dropdown"
              className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
            >
              <FontAwesomeIcon
                icon={faSort}
                id="sort-dropdown"
                className="w-5 h-5 text-gray-500 dark:text-gray-300"
              />
            </div>

            {sortDropdown ? (
              <SortDropdown
                sortBy={sortBy}
                setSort={setSortBy}
                toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
              />
            ) : null}
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
