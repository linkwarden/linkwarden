import Link from "next/link";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import React, { useEffect, useState } from "react";
import ProfilePhoto from "./ProfilePhoto";
import usePermissions from "@/hooks/usePermissions";
import useLocalSettingsStore from "@/store/localSettings";
import getPublicUserData from "@/lib/client/getPublicUserData";
import useAccountStore from "@/store/account";
import EditCollectionModal from "./ModalContent/EditCollectionModal";
import EditCollectionSharingModal from "./ModalContent/EditCollectionSharingModal";
import DeleteCollectionModal from "./ModalContent/DeleteCollectionModal";
import { dropdownTriggerer } from "@/lib/client/utils";

type Props = {
  collection: CollectionIncludingMembersAndLinkCount;
  className?: string;
};

export default function CollectionCard({ collection, className }: Props) {
  const { settings } = useLocalSettingsStore();
  const { account } = useAccountStore();

  const formattedDate = new Date(collection.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const permissions = usePermissions(collection.id as number);

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
      if (collection && collection.ownerId !== account.id) {
        const owner = await getPublicUserData(collection.ownerId as number);
        setCollectionOwner(owner);
      } else if (collection && collection.ownerId === account.id) {
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
  }, [collection]);

  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [editCollectionSharingModal, setEditCollectionSharingModal] =
    useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);

  return (
    <div className="relative">
      <div className="dropdown dropdown-bottom dropdown-end absolute top-3 right-3 z-20">
        <div
          tabIndex={0}
          role="button"
          onMouseDown={dropdownTriggerer}
          className="btn btn-ghost btn-sm btn-square text-neutral"
        >
          <i className="bi-three-dots text-xl" title="More"></i>
        </div>
        <ul className="dropdown-content z-[1] menu shadow bg-base-200 border border-neutral-content rounded-box w-52 mt-1">
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
              {permissions === true ? "Share and Collaborate" : "View Team"}
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
              {permissions === true ? "Delete Collection" : "Leave Collection"}
            </div>
          </li>
        </ul>
      </div>
      <div
        className="flex items-center absolute bottom-3 left-3 z-10 btn px-2 btn-ghost rounded-full"
        onClick={() => setEditCollectionSharingModal(true)}
      >
        {collectionOwner.id ? (
          <ProfilePhoto
            src={collectionOwner.image || undefined}
            name={collectionOwner.name}
          />
        ) : undefined}
        {collection.members
          .sort((a, b) => (a.userId as number) - (b.userId as number))
          .map((e, i) => {
            return (
              <ProfilePhoto
                key={i}
                src={e.user.image ? e.user.image : undefined}
                name={e.user.name}
                className="-ml-3"
              />
            );
          })
          .slice(0, 3)}
        {collection.members.length - 3 > 0 ? (
          <div className={`avatar drop-shadow-md placeholder -ml-3`}>
            <div className="bg-base-100 text-neutral rounded-full w-8 h-8 ring-2 ring-neutral-content">
              <span>+{collection.members.length - 3}</span>
            </div>
          </div>
        ) : null}
      </div>
      <Link
        href={`/collections/${collection.id}`}
        style={{
          backgroundImage: `linear-gradient(45deg, ${collection.color}30 10%, ${
            settings.theme === "dark" ? "oklch(var(--b2))" : "oklch(var(--b2))"
          } 50%, ${
            settings.theme === "dark" ? "oklch(var(--b2))" : "oklch(var(--b2))"
          } 100%)`,
        }}
        className="card card-compact shadow-md hover:shadow-none duration-200 border border-neutral-content"
      >
        <div className="card-body flex flex-col justify-between min-h-[12rem]">
          <div className="flex justify-between">
            <p className="card-title break-words line-clamp-2 w-full">
              {collection.name}
            </p>
            <div className="w-8 h-8 ml-10"></div>
          </div>

          <div className="flex justify-end items-center">
            <div className="text-right">
              <div className="font-bold text-sm flex justify-end gap-1 items-center">
                {collection.isPublic ? (
                  <i
                    className="bi-globe2 drop-shadow text-neutral"
                    title="This collection is being shared publicly."
                  ></i>
                ) : undefined}
                <i
                  className="bi-link-45deg text-lg text-neutral"
                  title="This collection is being shared publicly."
                ></i>
                {collection._count && collection._count.links}
              </div>
              <div className="flex items-center justify-end gap-1 text-neutral">
                <p className="font-bold text-xs flex gap-1 items-center">
                  <i
                    className="bi-calendar3 text-neutral"
                    title="This collection is being shared publicly."
                  ></i>
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {editCollectionModal ? (
        <EditCollectionModal
          onClose={() => setEditCollectionModal(false)}
          activeCollection={collection}
        />
      ) : undefined}
      {editCollectionSharingModal ? (
        <EditCollectionSharingModal
          onClose={() => setEditCollectionSharingModal(false)}
          activeCollection={collection}
        />
      ) : undefined}
      {deleteCollectionModal ? (
        <DeleteCollectionModal
          onClose={() => setDeleteCollectionModal(false)}
          activeCollection={collection}
        />
      ) : undefined}
    </div>
  );
}
