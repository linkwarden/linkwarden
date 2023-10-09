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
import { useTheme } from "next-themes";

export default function Collections() {
  const { theme } = useTheme();

  const { collections } = useCollectionStore();
  const [expandDropdown, setExpandDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);
  const [sortedCollections, setSortedCollections] = useState(collections);

  const session = useSession();

  const { setModal } = useModalStore();

  useSort({ sortBy, setData: setSortedCollections, data: collections });

  return (
    <MainLayout>
      <div className="p-5">
        <div className="flex gap-3 items-center justify-between mb-5">
          <div className="flex gap-3 items-end">
            <div className="flex gap-2">
              <FontAwesomeIcon
                icon={faFolder}
                className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-500 dark:text-sky-500 drop-shadow"
              />
              <p className="sm:text-4xl text-3xl capitalize text-black dark:text-white">
                All Collections
              </p>
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
                  className="absolute top-8 left-0 w-36"
                />
              ) : null}
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

        <div className="grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
          {sortedCollections.map((e, i) => {
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
      </div>
    </MainLayout>
  );
}
