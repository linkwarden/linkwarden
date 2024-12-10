import CollectionCard from "@/components/CollectionCard";
import { useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useSession } from "next-auth/react";
import SortDropdown from "@/components/SortDropdown";
import { Sort } from "@/types/global";
import useSort from "@/hooks/useSort";
import NewCollectionModal from "@/components/ModalContent/NewCollectionModal";
import PageHeader from "@/components/PageHeader";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { dropdownTriggerer } from "@/lib/client/utils";

export default function Collections() {
  const { t } = useTranslation();
  const { data: collections = [] } = useCollections();
  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );
  const [sortedCollections, setSortedCollections] = useState(collections);

  const { data } = useSession();

  useSort({ sortBy, setData: setSortedCollections, data: collections });

  const [newCollectionModal, setNewCollectionModal] = useState(false);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full h-full">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <PageHeader
              icon={"bi-folder"}
              title={t("collections")}
              description={t("collections_you_own")}
            />
            <div className="relative">
              <div className={"dropdown dropdown-bottom font-normal"}>
                <div
                  tabIndex={0}
                  role="button"
                  onMouseDown={dropdownTriggerer}
                  className="btn btn-ghost btn-sm btn-square text-neutral"
                >
                  <i className={"bi-three-dots text-neutral text-2xl"}></i>
                </div>
                <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box mt-1">
                  <li>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setNewCollectionModal(true)}
                      className="whitespace-nowrap"
                    >
                      {t("new_collection")}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <div className="relative mt-2">
              <SortDropdown sortBy={sortBy} setSort={setSortBy} t={t} />
            </div>
          </div>
        </div>

        <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
          {sortedCollections
            .filter((e) => e.ownerId === data?.user.id && e.parentId === null)
            .map((e, i) => {
              return <CollectionCard key={i} collection={e} />;
            })}

          <div
            className="card card-compact shadow-md hover:shadow-none duration-200 border border-neutral-content p-5 bg-base-200 self-stretch min-h-[12rem] rounded-2xl cursor-pointer flex flex-col gap-4 justify-center items-center group btn"
            onClick={() => setNewCollectionModal(true)}
          >
            <p className="group-hover:opacity-0 duration-100">
              {t("new_collection")}
            </p>
            <i className="bi-plus-lg text-5xl group-hover:text-7xl group-hover:-mt-6 text-primary drop-shadow duration-100"></i>
          </div>
        </div>

        {sortedCollections.filter((e) => e.ownerId !== data?.user.id)[0] && (
          <>
            <PageHeader
              icon={"bi-folder"}
              title={t("other_collections")}
              description={t("other_collections_desc")}
            />

            <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
              {sortedCollections
                .filter((e) => e.ownerId !== data?.user.id)
                .map((e, i) => {
                  return <CollectionCard key={i} collection={e} />;
                })}
            </div>
          </>
        )}
      </div>
      {newCollectionModal && (
        <NewCollectionModal onClose={() => setNewCollectionModal(false)} />
      )}
    </MainLayout>
  );
}

export { getServerSideProps };
