import Link from "next/link";
import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
} from "@linkwarden/types";
import React, { useEffect, useState } from "react";
import ProfilePhoto from "./ProfilePhoto";
import usePermissions from "@/hooks/usePermissions";
import getPublicUserData from "@/lib/client/getPublicUserData";
import EditCollectionModal from "./ModalContent/EditCollectionModal";
import EditCollectionSharingModal from "./ModalContent/EditCollectionSharingModal";
import DeleteCollectionModal from "./ModalContent/DeleteCollectionModal";
import { useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

export default function CollectionCard({
  collection,
}: {
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  const { t } = useTranslation();
  const { data: user } = useUser();

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
      if (collection && collection.ownerId !== user?.id) {
        const owner = await getPublicUserData(collection.ownerId as number);
        setCollectionOwner(owner);
      } else if (collection && collection.ownerId === user?.id) {
        setCollectionOwner({
          id: user?.id as number,
          name: user?.name,
          username: user?.username as string,
          image: user?.image as string,
          archiveAsScreenshot: user?.archiveAsScreenshot as boolean,
          archiveAsMonolith: user?.archiveAsMonolith as boolean,
          archiveAsPDF: user?.archiveAsPDF as boolean,
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-20"
          >
            <i title="More" className="bi-three-dots text-xl" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          sideOffset={4}
          side="bottom"
          align="end"
          className="z-[30]"
        >
          {permissions === true && (
            <DropdownMenuItem onSelect={() => setEditCollectionModal(true)}>
              <i className="bi-pencil-square" />
              {t("edit_collection_info")}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onSelect={() => setEditCollectionSharingModal(true)}
          >
            <i className="bi-globe" />
            {permissions === true ? t("share_and_collaborate") : t("view_team")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => setDeleteCollectionModal(true)}
            className="text-error"
          >
            {permissions === true ? (
              <>
                <i className="bi-trash" />
                {t("delete_collection")}
              </>
            ) : (
              <>
                <i className="bi-box-arrow-left" />
                {t("leave_collection")}
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div
        className="flex items-center absolute bottom-3 left-3 z-10 px-1 py-1 rounded-full cursor-pointer hover:bg-base-content/20 transition-colors duration-200"
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
            user?.theme === "dark" ? "oklch(var(--b2))" : "oklch(var(--b2))"
          } 50%, ${
            user?.theme === "dark" ? "oklch(var(--b2))" : "oklch(var(--b2))"
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
                  title={t("links")}
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
