import useCollectionStore from "@/store/collections";
import {
  faEllipsis,
  faFolder,
  faPlus,
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CollectionCard from "@/components/CollectionCard";
import Dropdown from "@/components/Dropdown";
import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useSession } from "next-auth/react";
import useModalStore from "@/store/modals";
import SortDropdown from "@/components/SortDropdown";
import { Sort } from "@/types/global";
import useSort from "@/hooks/useSort";

export default function Collections() {
  const { collections } = useCollectionStore();
  const [expandDropdown, setExpandDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);
  const [sortedCollections, setSortedCollections] = useState(collections);

  const { data } = useSession();

  const { setModal } = useModalStore();

  useSort({ sortBy, setData: setSortedCollections, data: collections });

  return (
    <MainLayout>
      <div className="p-5">
        <div className="flex gap-3 justify-between mb-5">
          <div className="flex gap-3">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faFolder}
                className="sm:w-10 sm:h-10 w-6 h-6 text-sky-500 dark:text-sky-500 drop-shadow"
              />
              <div>
                <p className="text-3xl capitalize text-black dark:text-white font-thin">
                  Your Collections
                </p>

                <p className="capitalize text-black dark:text-white">
                  Collections you own
                </p>
              </div>
            </div>
            <div className="relative mt-2">
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
                      name: "New Collection",
                      onClick: () => {
                        setModal({
                          modal: "COLLECTION",
                          state: true,
                          method: "CREATE",
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
                  className="absolute top-8 sm:left-0 right-0 sm:right-auto w-36"
                />
              ) : null}
            </div>
          </div>

          <div className="relative mt-2">
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

        <div className="grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
          {sortedCollections
            .filter((e) => e.ownerId === data?.user.id)
            .map((e, i) => {
              return <CollectionCard key={i} collection={e} />;
            })}

          <div
            className="p-5 bg-gray-50 dark:bg-neutral-800 self-stretch border border-solid border-sky-100 dark:border-neutral-700 min-h-[12rem] rounded-2xl cursor-pointer shadow duration-100 hover:shadow-none flex flex-col gap-4 justify-center items-center group"
            onClick={() => {
              setModal({
                modal: "COLLECTION",
                state: true,
                method: "CREATE",
              });
            }}
          >
            <p className="text-black dark:text-white group-hover:opacity-0 duration-100">
              New Collection
            </p>
            <FontAwesomeIcon
              icon={faPlus}
              className="w-8 h-8 text-sky-500 dark:text-sky-500 group-hover:w-12 group-hover:h-12 group-hover:-mt-10 duration-100"
            />
          </div>
        </div>

        {sortedCollections.filter((e) => e.ownerId !== data?.user.id)[0] ? (
          <>
            <div className="flex items-center gap-3 my-5">
              <FontAwesomeIcon
                icon={faFolder}
                className="sm:w-10 sm:h-10 w-6 h-6 text-sky-500 dark:text-sky-500 drop-shadow"
              />
              <div>
                <p className="text-3xl capitalize text-black dark:text-white font-thin">
                  Other Collections
                </p>

                <p className="capitalize text-black dark:text-white">
                  Shared collections you&apos;re a member of
                </p>
              </div>
            </div>

            <div className="grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
              {sortedCollections
                .filter((e) => e.ownerId !== data?.user.id)
                .map((e, i) => {
                  return <CollectionCard key={i} collection={e} />;
                })}
            </div>
          </>
        ) : undefined}
      </div>
    </MainLayout>
  );
}
