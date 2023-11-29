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
import NewCollectionModal from "@/components/Modals/NewCollectionModal";

export default function Collections() {
  const { collections } = useCollectionStore();
  const [expandDropdown, setExpandDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);
  const [sortedCollections, setSortedCollections] = useState(collections);

  const { data } = useSession();

  const { setModal } = useModalStore();

  useSort({ sortBy, setData: setSortedCollections, data: collections });

  const [newModalIsOpen, setNewModalIsOpen] = useState(false);
  const closeNewModal = () => setNewModalIsOpen(false);

  return (
    <MainLayout>
      <div className="p-5">
        <div className="flex gap-3 justify-between mb-5">
          <div className="flex gap-3">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={faFolder}
                className="sm:w-10 sm:h-10 w-6 h-6 text-primary drop-shadow"
              />
              <div>
                <p className="text-3xl capitalize font-thin">
                  Your Collections
                </p>

                <p>Collections you own</p>
              </div>
            </div>
            <div className="relative mt-2">
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
              className="btn btn-ghost btn-square btn-sm"
            >
              <FontAwesomeIcon
                icon={faSort}
                id="sort-dropdown"
                className="w-5 h-5 text-neutral"
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
            className="card card-compact shadow-md hover:shadow-none duration-200 border border-neutral-content p-5 bg-base-200 self-stretch min-h-[12rem] rounded-2xl cursor-pointer flex flex-col gap-4 justify-center items-center group btn"
            onClick={() => setNewModalIsOpen(true)}
          >
            <p className="group-hover:opacity-0 duration-100">New Collection</p>
            <FontAwesomeIcon
              icon={faPlus}
              className="w-8 h-8 text-primary group-hover:w-12 group-hover:h-12 group-hover:-mt-10 duration-100"
            />
          </div>
        </div>

        {sortedCollections.filter((e) => e.ownerId !== data?.user.id)[0] ? (
          <>
            <div className="flex items-center gap-3 my-5">
              <FontAwesomeIcon
                icon={faFolder}
                className="sm:w-10 sm:h-10 w-6 h-6 text-primary drop-shadow"
              />
              <div>
                <p className="text-3xl capitalize font-thin">
                  Other Collections
                </p>

                <p>Shared collections you&apos;re a member of</p>
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
      <NewCollectionModal
        isOpen={newModalIsOpen}
        onClose={closeNewModal}
        modalId="new-collection-modal-1"
      />
    </MainLayout>
  );
}
