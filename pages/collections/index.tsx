import useCollectionStore from "@/store/collections";
import CollectionCard from "@/components/CollectionCard";
import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useSession } from "next-auth/react";
import SortDropdown from "@/components/SortDropdown";
import { Sort } from "@/types/global";
import useSort from "@/hooks/useSort";
import NewCollectionModal from "@/components/ModalContent/NewCollectionModal";
import PageHeader from "@/components/PageHeader";

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
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <PageHeader
            icon={"bi-folder"}
            title={"Collections"}
            description={"Collections you own"}
          />

          <div className="flex gap-3 justify-end">
            <div className="relative mt-2">
              <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            </div>
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
            <i className="bi-plus-lg text-5xl group-hover:text-7xl group-hover:-mt-6 text-primary drop-shadow duration-100"></i>
          </div>
        </div>

        {sortedCollections.filter((e) => e.ownerId !== data?.user.id)[0] ? (
          <>
            <div className="flex items-center gap-3 my-5">
              <i className="bi-folder text-3xl sm:text-2xl text-primary drop-shadow"></i>

              <div>
                <p className="text-3xl capitalize font-thin">
                  Other Collections
                </p>

                <p className="sm:text-sm text-xs">
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
      {newCollectionModal ? (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      ) : undefined}
    </MainLayout>
  );
}
