import {
  CollectionIncludingMembersAndLinkCount,
  Sort,
  ViewMode,
} from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import ProfilePhoto from "@/components/ProfilePhoto";
import usePermissions from "@/hooks/usePermissions";
import NoLinksFound from "@/components/NoLinksFound";
import useLocalSettingsStore from "@/store/localSettings";
import getPublicUserData from "@/lib/client/getPublicUserData";
import EditCollectionModal from "@/components/ModalContent/EditCollectionModal";
import EditCollectionSharingModal from "@/components/ModalContent/EditCollectionSharingModal";
import DeleteCollectionModal from "@/components/ModalContent/DeleteCollectionModal";
import { dropdownTriggerer } from "@/lib/client/utils";
import NewCollectionModal from "@/components/ModalContent/NewCollectionModal";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import LinkListOptions from "@/components/LinkListOptions";
import { useCollections } from "@/hooks/store/collections";
import { useUser } from "@/hooks/store/user";
import { useLinks } from "@/hooks/store/links";
import Links from "@/components/LinkViews/Links";

export default function Index() {
  const { t } = useTranslation();
  const { settings } = useLocalSettingsStore();

  const router = useRouter();

  const { data: collections = [] } = useCollections();

  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const { links, data } = useLinks({
    sort: sortBy,
    collectionId: Number(router.query.id),
  });

  const [activeCollection, setActiveCollection] =
    useState<CollectionIncludingMembersAndLinkCount>();

  const permissions = usePermissions(activeCollection?.id as number);

  useEffect(() => {
    setActiveCollection(
      collections.find((e) => e.id === Number(router.query.id))
    );
  }, [router, collections]);

  const { data: user = {} } = useUser();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsMonolith: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

  useEffect(() => {
    const fetchOwner = async () => {
      if (activeCollection && activeCollection.ownerId !== user.id) {
        const owner = await getPublicUserData(
          activeCollection.ownerId as number
        );
        setCollectionOwner(owner);
      } else if (activeCollection && activeCollection.ownerId === user.id) {
        setCollectionOwner({
          id: user.id as number,
          name: user.name,
          username: user.username as string,
          image: user.image as string,
          archiveAsScreenshot: user.archiveAsScreenshot as boolean,
          archiveAsMonolith: user.archiveAsScreenshot as boolean,
          archiveAsPDF: user.archiveAsPDF as boolean,
        });
      }
    };

    fetchOwner();
  }, [activeCollection]);

  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [newCollectionModal, setNewCollectionModal] = useState(false);
  const [editCollectionSharingModal, setEditCollectionSharingModal] =
    useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );

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

              <p className="sm:text-3xl text-2xl capitalize w-full py-1 break-words hyphens-auto font-thin">
                {activeCollection?.name}
              </p>
            </div>

            <div className="dropdown dropdown-bottom dropdown-end mt-2">
              <div
                tabIndex={0}
                role="button"
                onMouseDown={dropdownTriggerer}
                className="btn btn-ghost btn-sm btn-square text-neutral"
              >
                <i className="bi-three-dots text-xl" title="More"></i>
              </div>
              <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-box mt-1">
                {permissions === true && (
                  <li>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        (document?.activeElement as HTMLElement)?.blur();
                        setEditCollectionModal(true);
                      }}
                      className="whitespace-nowrap"
                    >
                      {t("edit_collection_info")}
                    </div>
                  </li>
                )}
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setEditCollectionSharingModal(true);
                    }}
                    className="whitespace-nowrap"
                  >
                    {permissions === true
                      ? t("share_and_collaborate")
                      : t("view_team")}
                  </div>
                </li>
                {permissions === true && (
                  <li>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        (document?.activeElement as HTMLElement)?.blur();
                        setNewCollectionModal(true);
                      }}
                      className="whitespace-nowrap"
                    >
                      {t("create_subcollection")}
                    </div>
                  </li>
                )}
                <li>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      (document?.activeElement as HTMLElement)?.blur();
                      setDeleteCollectionModal(true);
                    }}
                    className="whitespace-nowrap"
                  >
                    {permissions === true
                      ? t("delete_collection")
                      : t("leave_collection")}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeCollection && (
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

              <p className="text-neutral text-sm">
                {activeCollection.members.length > 0 &&
                activeCollection.members.length === 1
                  ? t("by_author_and_other", {
                      author: collectionOwner.name,
                      count: activeCollection.members.length,
                    })
                  : activeCollection.members.length > 0 &&
                      activeCollection.members.length !== 1
                    ? t("by_author_and_others", {
                        author: collectionOwner.name,
                        count: activeCollection.members.length,
                      })
                    : t("by_author", {
                        author: collectionOwner.name,
                      })}
              </p>
            </div>
          </div>
        )}

        {activeCollection?.description && (
          <p>{activeCollection?.description}</p>
        )}

        {/* {collections.some((e) => e.parentId === activeCollection.id) ? (
          <fieldset className="border rounded-md p-2 border-neutral-content">
            <legend className="text-sm ml-2">Sub-Collections</legend>
            <div className="flex gap-3">
              {collections
                .filter((e) => e.parentId === activeCollection?.id)
                .map((e, i) => {
                  return (
                    <Link
                      key={i}
                      className="flex gap-1 items-center btn btn-ghost btn-sm"
                      href={`/collections/${e.id}`}
                    >
                      <i
                        className="bi-folder-fill text-2xl drop-shadow"
                        style={{ color: e.color }}
                      ></i>
                      <p className="text-xs">{e.name}</p>
                    </Link>
                  );
                })}
            </div>
          </fieldset>
        ) : undefined} */}

        <div className="divider my-0"></div>

        <LinkListOptions
          t={t}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          editMode={
            permissions === true ||
            permissions?.canUpdate ||
            permissions?.canDelete
              ? editMode
              : undefined
          }
          setEditMode={
            permissions === true ||
            permissions?.canUpdate ||
            permissions?.canDelete
              ? setEditMode
              : undefined
          }
        >
          <p>
            {activeCollection?._count?.links === 1
              ? t("showing_count_result", {
                  count: activeCollection?._count?.links,
                })
              : t("showing_count_results", {
                  count: activeCollection?._count?.links,
                })}
          </p>
        </LinkListOptions>

        <Links
          editMode={editMode}
          links={links}
          layout={viewMode}
          placeholderCount={1}
          useData={data}
        />
        {!data.isLoading && links && !links[0] && <NoLinksFound />}
      </div>
      {activeCollection && (
        <>
          {editCollectionModal && (
            <EditCollectionModal
              onClose={() => setEditCollectionModal(false)}
              activeCollection={activeCollection}
            />
          )}
          {editCollectionSharingModal && (
            <EditCollectionSharingModal
              onClose={() => setEditCollectionSharingModal(false)}
              activeCollection={activeCollection}
            />
          )}
          {newCollectionModal && (
            <NewCollectionModal
              onClose={() => setNewCollectionModal(false)}
              parent={activeCollection}
            />
          )}
          {deleteCollectionModal && (
            <DeleteCollectionModal
              onClose={() => setDeleteCollectionModal(false)}
              activeCollection={activeCollection}
            />
          )}
        </>
      )}
    </MainLayout>
  );
}

export { getServerSideProps };
