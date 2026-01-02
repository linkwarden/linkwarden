import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import toast from "react-hot-toast";
import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
  Member,
} from "@linkwarden/types";
import getPublicUserData from "@/lib/client/getPublicUserData";
import usePermissions from "@/hooks/usePermissions";
import ProfilePhoto from "../ProfilePhoto";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useUpdateCollection } from "@linkwarden/router/collections";
import { useUser } from "@linkwarden/router/user";
import CopyButton from "../CopyButton";
import { useRouter } from "next/router";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User } from "@linkwarden/prisma/client";
import { Separator } from "../ui/separator";

type Props = {
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function EditCollectionSharingModal({
  onClose,
  activeCollection,
}: Props) {
  const { t } = useTranslation();

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);

  const [propagateToSubcollections, setPropagateToSubcollections] =
    useState(false);

  const [submitLoader, setSubmitLoader] = useState(false);
  const updateCollection = useUpdateCollection();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading(t("updating_collection"));

      await updateCollection.mutateAsync(
        { ...collection, propagateToSubcollections },
        {
          onSettled: (data, error) => {
            setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            onClose();
            toast.success(t("updated"));
          }
        },
      });
    }
  };

  const { data: user } = useUser();
  const permissions = usePermissions(collection.id as number);

  const currentURL = new URL(document.URL);

  const publicCollectionURL = `${currentURL.origin}/public/collections/${collection.id}`;

  const [memberIdentifier, setMemberIdentifier] = useState("");

  const [collectionOwner, setCollectionOwner] = useState<
    Partial<AccountSettings>
  >({});

  useEffect(() => {
    const fetchOwner = async () => {
      const owner = await getPublicUserData(collection.ownerId as number);
      setCollectionOwner(owner);
    };

    fetchOwner();

    setCollection(activeCollection);
  }, []);

  const setMemberState = (newMember: Member) => {
    if (!collection) return null;

    setCollection({
      ...collection,
      members: [...collection.members, newMember],
    });
    setMemberIdentifier("");
  };

  const router = useRouter();
  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">
        {permissions === true && !isPublicRoute
          ? t("share_and_collaborate")
          : t("team")}
      </p>

      <Separator className="my-3" />

      <div className="flex flex-col gap-3">
        {permissions === true && !isPublicRoute && (
          <div>
            <p>{t("make_collection_public")}</p>

            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                checked={collection.isPublic}
                onChange={() =>
                  setCollection({
                    ...collection,
                    isPublic: !collection.isPublic,
                  })
                }
                className="checkbox checkbox-primary"
              />
              <span className="label-text">
                {t("make_collection_public_checkbox")}
              </span>
            </label>

            <p className="text-neutral text-sm">
              {t("make_collection_public_desc")}
            </p>
          </div>
        )}

        {collection.isPublic && (
          <div>
            <p className="mb-2">{t("sharable_link")}</p>
            <div className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-2 bg-base-200 border-neutral-content border flex items-center gap-2 justify-between">
              {publicCollectionURL}
              <CopyButton text={publicCollectionURL} />
            </div>
          </div>
        )}

        {permissions === true && !isPublicRoute && (
          <Separator className="my-3" />
        )}

        {permissions === true && !isPublicRoute && (
          <>
            <p>{t("members")}</p>

            <div className="flex items-center gap-2">
              <TextInput
                value={memberIdentifier}
                className="bg-base-200"
                placeholder={t("add_member_placeholder")}
                onChange={(e) => setMemberIdentifier(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  addMemberToCollection(
                    user as any,
                    memberIdentifier.replace(/^@/, ""),
                    collection,
                    setMemberState,
                    t
                  )
                }
              />

              <Button
                variant="accent"
                size="icon"
                className="h-10 w-10"
                onClick={() =>
                  addMemberToCollection(
                    user as any,
                    memberIdentifier.replace(/^@/, ""),
                    collection,
                    setMemberState,
                    t
                  )
                }
              >
                <i className="bi-person-add text-xl" />
              </Button>
            </div>
          </>
        )}

        {collection?.members[0]?.user && (
          <>
            <div className="flex flex-col divide-y divide-neutral-content border border-neutral-content rounded-xl bg-base-200">
              <div
                className="relative p-3 bg-base-200 rounded-xl flex gap-2 justify-between"
                title={`@${collectionOwner.username} is the owner of this collection`}
              >
                <div className={"flex items-center justify-between w-full"}>
                  <div className={"flex items-center"}>
                    <div className={"shrink-0"}>
                      <ProfilePhoto
                        src={
                          collectionOwner.image
                            ? collectionOwner.image
                            : undefined
                        }
                        name={collectionOwner.name}
                      />
                    </div>
                    <div className={"grow ml-2"}>
                      <p className="text-sm font-semibold">
                        {collectionOwner.name}
                      </p>
                      <p className="text-xs text-neutral">
                        @{collectionOwner.username}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t("owner")}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e) => {
                  const roleKey: "viewer" | "contributor" | "admin" =
                    !e.canCreate && !e.canUpdate && !e.canDelete
                      ? "viewer"
                      : e.canCreate && !e.canUpdate && !e.canDelete
                        ? "contributor"
                        : "admin";

                  const handleRoleChange = (newRole: string) => {
                    const updatedMember = {
                      ...e,
                      canCreate: newRole !== "viewer",
                      canUpdate: newRole === "admin",
                      canDelete: newRole === "admin",
                    };
                    setCollection({
                      ...collection,
                      members: collection.members.map((m) =>
                        m.userId === e.userId ? updatedMember : m
                      ),
                    });
                  };

                  return (
                    <>
                      <div
                        key={e.userId}
                        className="relative p-3 bg-base-200 rounded-xl flex gap-2 justify-between border-none"
                      >
                        <div className="flex items-center">
                          <ProfilePhoto
                            src={e.user.image ? e.user.image : undefined}
                            name={e.user.name}
                          />
                          <div className="ml-2">
                            <p className="text-sm font-semibold">
                              {e.user.name}
                            </p>
                            <p className="text-xs text-neutral">
                              @{e.user.username}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {permissions === true && !isPublicRoute ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8">
                                  {t(roleKey)} <i className="bi-chevron-down" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent sideOffset={4} align="end">
                                <DropdownMenuRadioGroup
                                  value={roleKey}
                                  onValueChange={handleRoleChange}
                                >
                                  <DropdownMenuRadioItem value="viewer">
                                    <div>
                                      <p className="font-bold whitespace-nowrap">
                                        {t("viewer")}
                                      </p>
                                      <p className="whitespace-nowrap">
                                        {t("viewer_desc")}
                                      </p>
                                    </div>
                                  </DropdownMenuRadioItem>

                                  <DropdownMenuRadioItem value="contributor">
                                    <div>
                                      <p className="font-bold whitespace-nowrap">
                                        {t("contributor")}
                                      </p>
                                      <p className="whitespace-nowrap">
                                        {t("contributor_desc")}
                                      </p>
                                    </div>
                                  </DropdownMenuRadioItem>

                                  <DropdownMenuRadioItem value="admin">
                                    <div>
                                      <p className="font-bold whitespace-nowrap">
                                        {t("admin")}
                                      </p>
                                      <p className="whitespace-nowrap">
                                        {t("admin_desc")}
                                      </p>
                                    </div>
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <p className="text-sm text-neutral">{t(roleKey)}</p>
                          )}

                          {permissions === true && !isPublicRoute && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-neutral hover:text-red-500"
                              onClick={() => {
                                setCollection({
                                  ...collection,
                                  members: collection.members.filter(
                                    (member) => member.userId !== e.userId
                                  ),
                                });
                              }}
                            >
                              <i
                                className="bi-x text-xl"
                                title={t("remove_member")}
                              />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Separator className="last:hidden" />
                    </>
                  );
                })}
            </div>
          </>
        )}

        {permissions === true && !isPublicRoute && (
          <div>
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                checked={propagateToSubcollections}
                onChange={() =>
                  setPropagateToSubcollections(!propagateToSubcollections)
                }
                className="checkbox checkbox-primary"
              />
              <span className="label-text">
                {t("propagate_to_subcollections")}
              </span>
            </label>
            <p className="text-neutral text-sm">
              {t("propagate_to_subcollections_desc")}
            </p>
          </div>
        )}

        {permissions === true && !isPublicRoute && (
          <Button
            variant="accent"
            className="w-fit ml-auto mt-3"
            onClick={submit}
          >
            {t("save_changes")}
          </Button>
        )}
      </div>
    </Modal>
  );
}
