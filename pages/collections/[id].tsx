import LinkCard from "@/components/LinkCard";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { CollectionIncludingMembersAndLinkCount, Sort } from "@/types/global";
import { faEllipsis, faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
        });
      }
    };

    fetchOwner();
  }, [activeCollection]);

  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [editCollectionSharingModal, setEditCollectionSharingModal] =
    useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);

  return (
    <MainLayout>
      <div
        style={{
          backgroundImage: `linear-gradient(${activeCollection?.color}20 10%, ${
            settings.theme === "dark" ? "#262626" : "#f3f4f6"
          } 14rem, ${settings.theme === "dark" ? "#171717" : "#ffffff"} 100%)`,
        }}
        className="h-full p-5 flex gap-3 flex-col"
      >
        <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-start">
          {activeCollection && (
            <div className="flex gap-3 items-center">
              <div className="flex gap-2">
                <FontAwesomeIcon
                  icon={faFolder}
                  style={{ color: activeCollection?.color }}
                  className="sm:w-8 sm:h-8 w-6 h-6 mt-3 drop-shadow"
                />
                <p className="sm:text-4xl text-3xl capitalize w-full py-1 break-words hyphens-auto font-thin">
                  {activeCollection?.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {activeCollection ? (
          <div className={`min-w-[15rem]`}>
            <div className="flex gap-1 justify-center sm:justify-end items-center w-fit">
              <div
                className="flex items-center btn px-2 btn-ghost rounded-full w-fit"
                onClick={() => setEditCollectionSharingModal(true)}
              >
                {collectionOwner.id ? (
                  <ProfilePhoto src={collectionOwner.image || undefined} />
                ) : undefined}
                {activeCollection.members
                  .sort((a, b) => (a.userId as number) - (b.userId as number))
                  .map((e, i) => {
                    return (
                      <ProfilePhoto
                        key={i}
                        src={e.user.image ? e.user.image : undefined}
                        className="-ml-3"
                      />
                    );
                  })
                  .slice(0, 3)}
                {activeCollection.members.length - 3 > 0 ? (
                  <div className={`avatar placeholder -ml-3`}>
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
            <div className="relative">
              <div className="dropdown dropdown-bottom dropdown-end">
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
          </div>
        </div>

        {links.some((e) => e.collectionId === Number(router.query.id)) ? (
          <div className="grid grid-cols-1 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
            {links
              .filter((e) => e.collection.id === activeCollection?.id)
              .map((e, i) => {
                return <LinkCard key={i} link={e} count={i} />;
              })}
          </div>
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
