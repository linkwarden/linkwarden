import Dropdown from "@/components/Dropdown";
import LinkCard from "@/components/LinkCard";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { CollectionIncludingMembersAndLinkCount, Sort } from "@/types/global";
import {
  faEllipsis,
  faFolder,
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useSession } from "next-auth/react";
import ProfilePhoto from "@/components/ProfilePhoto";
import SortDropdown from "@/components/SortDropdown";
import useModalStore from "@/store/modals";
import useLinks from "@/hooks/useLinks";
import usePermissions from "@/hooks/usePermissions";
import NoLinksFound from "@/components/NoLinksFound";

export default function Index() {
  const { setModal } = useModalStore();

  const router = useRouter();

  const { links } = useLinkStore();
  const { collections } = useCollectionStore();

  const { data } = useSession();

  const [expandDropdown, setExpandDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  const [activeCollection, setActiveCollection] =
    useState<CollectionIncludingMembersAndLinkCount>();

  const permissions = usePermissions(activeCollection?.id as number);

  useLinks({ collectionId: Number(router.query.id), sort: sortBy });

  useEffect(() => {
    setActiveCollection(
      collections.find((e) => e.id === Number(router.query.id))
    );
  }, [router, collections]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="bg-gradient-to-tr from-sky-100 dark:from-gray-800 from-10% via-gray-100 via-20% to-white dark:to-neutral-800 to-100% rounded-2xl shadow min-h-[10rem] p-5 flex gap-5 flex-col justify-between">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center sm:items-start">
            {activeCollection && (
              <div className="flex gap-3 items-center">
                <div className="flex gap-2">
                  <FontAwesomeIcon
                    icon={faFolder}
                    style={{ color: activeCollection?.color }}
                    className="sm:w-8 sm:h-8 w-6 h-6 mt-3 drop-shadow"
                  />
                  <p className="sm:text-4xl text-3xl capitalize text-black dark:text-white w-full py-1 break-words hyphens-auto">
                    {activeCollection?.name}
                  </p>
                </div>
              </div>
            )}

            {activeCollection ? (
              <div
                className={`min-w-[15rem] ${
                  activeCollection.members[0] && "mr-3"
                }`}
              >
                <div
                  onClick={() =>
                    setModal({
                      modal: "COLLECTION",
                      state: true,
                      method: "UPDATE",
                      isOwner: permissions === true,
                      active: activeCollection,
                      defaultIndex: permissions === true ? 1 : 0,
                    })
                  }
                  className="flex justify-center sm:justify-end items-center w-fit mx-auto sm:mr-0 sm:ml-auto group cursor-pointer"
                >
                  <div
                    className={`bg-sky-700 p-2 leading-3 select-none group-hover:bg-sky-600 duration-100 text-white rounded-full text-xs ${
                      activeCollection.members[0] && "mr-1"
                    }`}
                  >
                    {permissions === true ? "Manage" : "View"} Team
                  </div>
                  {activeCollection?.members
                    .sort((a, b) => (a.userId as number) - (b.userId as number))
                    .map((e, i) => {
                      return (
                        <ProfilePhoto
                          key={i}
                          src={`/api/avatar/${e.userId}?${Date.now()}`}
                          className="-mr-3 duration-100  border-[3px]"
                        />
                      );
                    })
                    .slice(0, 4)}
                  {activeCollection?.members.length &&
                  activeCollection.members.length - 4 > 0 ? (
                    <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-600 dark:bg-sky-600 border-slate-200 dark:border-neutral-700 -mr-3">
                      +{activeCollection?.members?.length - 4}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="text-black dark:text-white flex justify-between items-end gap-5">
            <p>{activeCollection?.description}</p>
            <div className="flex items-center gap-2">
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
              <div className="relative">
                <div
                  onClick={() => setExpandDropdown(!expandDropdown)}
                  id="expand-dropdown"
                  className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 hover:dark:bg-neutral-700 duration-100 p-1"
                >
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    id="expand-dropdown"
                    title="More"
                    className="w-5 h-5 text-gray-500 dark:text-gray-300"
                  />
                </div>
                {expandDropdown ? (
                  <Dropdown
                    items={[
                      permissions === true
                        ? {
                            name: "Edit Collection Info",
                            onClick: () => {
                              activeCollection &&
                                setModal({
                                  modal: "COLLECTION",
                                  state: true,
                                  method: "UPDATE",
                                  isOwner: permissions === true,
                                  active: activeCollection,
                                });
                              setExpandDropdown(false);
                            },
                          }
                        : undefined,
                      {
                        name:
                          permissions === true
                            ? "Share/Collaborate"
                            : "View Team",
                        onClick: () => {
                          activeCollection &&
                            setModal({
                              modal: "COLLECTION",
                              state: true,
                              method: "UPDATE",
                              isOwner: permissions === true,
                              active: activeCollection,
                              defaultIndex: permissions === true ? 1 : 0,
                            });
                          setExpandDropdown(false);
                        },
                      },

                      {
                        name:
                          permissions === true
                            ? "Delete Collection"
                            : "Leave Collection",
                        onClick: () => {
                          activeCollection &&
                            setModal({
                              modal: "COLLECTION",
                              state: true,
                              method: "UPDATE",
                              isOwner: permissions === true,
                              active: activeCollection,
                              defaultIndex: permissions === true ? 2 : 1,
                            });
                          setExpandDropdown(false);
                        },
                      },
                    ]}
                    onClickOutside={(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      if (target.id !== "expand-dropdown")
                        setExpandDropdown(false);
                    }}
                    className="absolute top-8 right-0 z-10 w-40"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
        {links.some((e) => e.collectionId === Number(router.query.id)) ? (
          <div className="grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
            {links
              .filter((e) => e.collectionId === Number(router.query.id))
              .map((e, i) => {
                return <LinkCard key={i} link={e} count={i} />;
              })}
          </div>
        ) : (
          <NoLinksFound />
        )}
      </div>
    </MainLayout>
  );
}
