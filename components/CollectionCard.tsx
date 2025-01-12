import Link from "next/link";
import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
} from "@/types/global";
import React, { useEffect, useState } from "react";
import ProfilePhoto from "./ProfilePhoto";
import usePermissions from "@/hooks/usePermissions";
import useLocalSettingsStore from "@/store/localSettings";
import getPublicUserData from "@/lib/client/getPublicUserData";
import EditCollectionModal from "./ModalContent/EditCollectionModal";
import EditCollectionSharingModal from "./ModalContent/EditCollectionSharingModal";
import DeleteCollectionModal from "./ModalContent/DeleteCollectionModal";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";

export default function CollectionCard({
  collection,
}: {
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  const { t } = useTranslation();
  const { settings } = useLocalSettingsStore();
  const { data: user = {} } = useUser();

  const formattedDate = new Date(collection.createdAt as string).toLocaleString(
    t("locale"),
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const permissions = usePermissions(collection.id as number);

  const [collectionOwner, setCollectionOwner] = useState<
    Partial<AccountSettings>
  >({});

  useEffect(() => {
    const fetchOwner = async () => {
      if (collection && collection.ownerId !== user.id) {
        const owner = await getPublicUserData(collection.ownerId as number);
        setCollectionOwner(owner);
      } else if (collection && collection.ownerId === user.id) {
        setCollectionOwner({
          id: user.id as number,
          name: user.name,
          username: user.username as string,
          image: user.image as string,
          archiveAsScreenshot: user.archiveAsScreenshot as boolean,
          archiveAsMonolith: user.archiveAsMonolith as boolean,
          archiveAsPDF: user.archiveAsPDF as boolean,
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
          <i className="bi-three-dots text-xl" title={t("more")}></i>
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
      <div
        className="flex items-center absolute bottom-3 left-3 z-10 btn px-2 btn-ghost rounded-full"
        onClick={() => setEditCollectionSharingModal(true)}
      >
        {collectionOwner.id && (
          <ProfilePhoto
            src={collectionOwner.image || undefined}
            name={collectionOwner.name}
          />
        )}
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
        {collection.members.length - 3 > 0 && (
          <div className={`avatar drop-shadow-md placeholder -ml-3`}>
            <div className="bg-base-100 text-neutral rounded-full w-8 h-8 ring-2 ring-neutral-content">
              <span>+{collection.members.length - 3}</span>
            </div>
          </div>
        )}
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
                {collection.isPublic && (
                  <i
                    className="bi-globe2 drop-shadow text-neutral"
                    title={t("collection_publicly_shared")}
                  ></i>
                )}
                <i
                  className="bi-link-45deg text-lg text-neutral"
                  title={t("collection_publicly_shared")}
                ></i>
                {collection._count && collection._count.links}
              </div>
              <div className="flex items-center justify-end gap-1 text-neutral">
                <p className="font-bold text-xs flex gap-1 items-center">
                  <i
                    className="bi-calendar3 text-neutral"
                    title={t("collection_publicly_shared")}
                  ></i>
                  {formattedDate}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
      {editCollectionModal && (
        <EditCollectionModal
          onClose={() => setEditCollectionModal(false)}
          activeCollection={collection}
        />
      )}
      {editCollectionSharingModal && (
        <EditCollectionSharingModal
          onClose={() => setEditCollectionSharingModal(false)}
          activeCollection={collection}
        />
      )}
      {deleteCollectionModal && (
        <DeleteCollectionModal
          onClose={() => setDeleteCollectionModal(false)}
          activeCollection={collection}
        />
      )}
    </div>
  );
}
