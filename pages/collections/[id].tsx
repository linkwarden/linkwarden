import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import {
  CollectionIncludingMembersAndLinkCount,
  Sort,
  ViewMode,
} from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import ProfilePhoto from "@/components/ProfilePhoto";
import SortDropdown from "@/components/SortDropdown";
import useLinks from "@/hooks/useLinks";
import usePermissions from "@/hooks/usePermissions";
import NoLinksFound from "@/components/NoLinksFound";
import useLocalSettingsStore from "@/store/localSettings";
import useAccountStore from "@/store/account";
import getPublicUserData from "@/lib/client/getPublicUserData";
import EditCollectionModal from "@/components/ModalContent/EditCollectionModal";
import EditCollectionSharingModal from "@/components/ModalContent/EditCollectionSharingModal";
import DeleteCollectionModal from "@/components/ModalContent/DeleteCollectionModal";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
// import GridView from "@/components/LinkViews/Layouts/GridView";
import ListView from "@/components/LinkViews/Layouts/ListView";

export default function Index() {
  const { settings } = useLocalSettingsStore();

  const router = useRouter();

  const { links } = useLinkStore();
  const { collections } = useCollectionStore();

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

  const { account } = useAccountStore();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

  useEffect(() => {
    const fetchOwner = async () => {
      if (activeCollection && activeCollection.ownerId !== account.id) {
        const owner = await getPublicUserData(
          activeCollection.ownerId as number
        );
        setCollectionOwner(owner);
      } else if (activeCollection && activeCollection.ownerId === account.id) {
        setCollectionOwner({
          id: account.id as number,
          name: account.name,
          username: account.username as string,
          image: account.image as string,
          archiveAsScreenshot: account.archiveAsScreenshot as boolean,
          archiveAsPDF: account.archiveAsPDF as boolean,
        });
      }
    };

    fetchOwner();
  }, [activeCollection]);

  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [editCollectionSharingModal, setEditCollectionSharingModal] =
    useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);

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
      <div
        className="h-[60rem] p-5 flex gap-3 flex-col"
        style={{
          backgroundImage: `linear-gradient(${activeCollection?.color}20 10%, ${
            settings.theme === "dark" ? "#262626" : "#f3f4f6"
          } 13rem, ${settings.theme === "dark" ? "#171717" : "#ffffff"} 100%)`,
        }}
      >
        {activeCollection && (
          <div className="flex gap-3 items-start justify-between">
            <div className="flex items-center gap-2">
              <i
                className="bi-folder-fill text-3xl drop-shadow"
                style={{ color: activeCollection?.color }}
              ></i>

              <p className="sm:text-4xl text-3xl capitalize w-full py-1 break-words hyphens-auto font-thin">
                {activeCollection?.name}
              </p>
            </div>

            <div className="dropdown dropdown-bottom dropdown-end mt-2">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm btn-square text-neutral"
              >
                <i className="bi-three-dots text-xl" title="More"></i>
              </div>
              <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box w-52 mt-1">
                {permissions === true ? (
                  <li>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        (document?.activeElement as HTMLElement)?.blur();
                        setEditCollectionModal(true);
                      }}
                    >
                      Edit Collection Info
                    </div>
                  </li>
                ) : undefined}
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setEditCollectionSharingModal(true);
                    }}
                  >
                    {permissions === true
                      ? "Share and Collaborate"
                      : "View Team"}
                  </div>
                </li>
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setDeleteCollectionModal(true);
                    }}
                  >
                    {permissions === true
                      ? "Delete Collection"
                      : "Leave Collection"}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeCollection ? (
          <div className={`min-w-[15rem]`}>
            <div className="flex gap-1 justify-center sm:justify-end items-center w-fit">
              <div
                className="flex items-center btn px-2 btn-ghost rounded-full w-fit"
                onClick={() => setEditCollectionSharingModal(true)}
              >
                {collectionOwner.id ? (
                  <ProfilePhoto
                    src={collectionOwner.image || undefined}
                    name={collectionOwner.name}
                  />
                ) : undefined}
                {activeCollection.members
                  .sort((a, b) => (a.userId as number) - (b.userId as number))
                  .map((e, i) => {
                    return (
                      <ProfilePhoto
                        key={i}
                        src={e.user.image ? e.user.image : undefined}
                        className="-ml-3"
                        name={e.user.name}
                      />
                    );
                  })
                  .slice(0, 3)}
                {activeCollection.members.length - 3 > 0 ? (
                  <div className={`avatar drop-shadow-md placeholder -ml-3`}>
                    <div className="bg-base-100 text-neutral rounded-full w-8 h-8 ring-2 ring-neutral-content">
                      <span>+{activeCollection.members.length - 3}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="text-neutral text-sm font-semibold">
                By {collectionOwner.name}
                {activeCollection.members.length > 0
                  ? ` and ${activeCollection.members.length} others`
                  : undefined}
                .
              </p>
            </div>
          </div>
        ) : undefined}

        {activeCollection?.description ? (
          <p>{activeCollection?.description}</p>
        ) : undefined}

        <div className="divider my-0"></div>

        <div className="flex justify-between items-end gap-5">
          <p>Showing {activeCollection?._count?.links} results</p>
          <div className="flex items-center gap-2">
            <SortDropdown sortBy={sortBy} setSort={setSortBy} />
            <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {links.some((e) => e.collectionId === Number(router.query.id)) ? (
          <LinkComponent
            links={links.filter(
              (e) => e.collection.id === activeCollection?.id
            )}
          />
        ) : (
          <NoLinksFound />
        )}
      </div>
      {activeCollection ? (
        <>
          {editCollectionModal ? (
            <EditCollectionModal
              onClose={() => setEditCollectionModal(false)}
              activeCollection={activeCollection}
            />
          ) : undefined}
          {editCollectionSharingModal ? (
            <EditCollectionSharingModal
              onClose={() => setEditCollectionSharingModal(false)}
              activeCollection={activeCollection}
            />
          ) : undefined}
          {deleteCollectionModal ? (
            <DeleteCollectionModal
              onClose={() => setDeleteCollectionModal(false)}
              activeCollection={activeCollection}
            />
          ) : undefined}
        </>
      ) : undefined}
    </MainLayout>
  );
}
