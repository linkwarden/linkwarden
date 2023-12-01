import useCollectionStore from "@/store/collections";
import {
  faEllipsis,
  faFolder,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CollectionCard from "@/components/CollectionCard";
import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useSession } from "next-auth/react";
import SortDropdown from "@/components/SortDropdown";
import { Sort } from "@/types/global";
import useSort from "@/hooks/useSort";
import NewCollectionModal from "@/components/Modals/NewCollectionModal";

export default function Collections() {
  const { collections } = useCollectionStore();
  const [expandDropdown, setExpandDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);
  const [sortedCollections, setSortedCollections] = useState(collections);

  const { data } = useSession();

  useSort({ sortBy, setData: setSortedCollections, data: collections });

  const [newCollectionModal, setNewCollectionModal] = useState(false);

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
              <div className="dropdown dropdown-bottom">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-sm btn-square text-neutral"
                >
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    title="More"
                    className="w-5 h-5"
                  />
                </div>
                <ul className="dropdown-content z-[1] menu p-1 shadow bg-base-200 border border-neutral-content rounded-xl w-36 mt-1">
                  <li>
                    <div
                      className="px-2 py-1 rounded-lg"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        (document?.activeElement as HTMLElement)?.blur();
                        setNewCollectionModal(true);
                      }}
                    >
                      New Collection
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="relative mt-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
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
            onClick={() => setNewCollectionModal(true)}
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
      {newCollectionModal ? (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      ) : undefined}
    </MainLayout>
  );
}
