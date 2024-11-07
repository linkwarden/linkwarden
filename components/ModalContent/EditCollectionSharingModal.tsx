import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import toast from "react-hot-toast";
import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
  Member,
} from "@/types/global";
import getPublicUserData from "@/lib/client/getPublicUserData";
import usePermissions from "@/hooks/usePermissions";
import ProfilePhoto from "../ProfilePhoto";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import Modal from "../Modal";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";
import { useUpdateCollection } from "@/hooks/store/collections";
import { useUser } from "@/hooks/store/user";
import CopyButton from "../CopyButton";
import { useRouter } from "next/router";

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

  const [submitLoader, setSubmitLoader] = useState(false);
  const updateCollection = useUpdateCollection();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading(t("updating_collection"));

      await updateCollection.mutateAsync(collection, {
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

  const { data: user = {} } = useUser();
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

      <div className="divider mb-3 mt-1"></div>

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
            <div className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-2 bg-base-200 border-neutral-content border-solid border flex items-center gap-2 justify-between">
              {publicCollectionURL}
              <CopyButton text={publicCollectionURL} />
            </div>
          </div>
        )}

        {permissions === true && !isPublicRoute && (
          <div className="divider my-3"></div>
        )}

        {permissions === true && !isPublicRoute && (
          <>
            <p>{t("members")}</p>

            <div className="flex items-center gap-2">
              <TextInput
                value={memberIdentifier || ""}
                className="bg-base-200"
                placeholder={t("add_member_placeholder")}
                onChange={(e) => setMemberIdentifier(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  addMemberToCollection(
                    user,
                    memberIdentifier.replace(/^@/, "") || "",
                    collection,
                    setMemberState,
                    t
                  )
                }
              />

              <div
                onClick={() =>
                  addMemberToCollection(
                    user,
                    memberIdentifier.replace(/^@/, "") || "",
                    collection,
                    setMemberState,
                    t
                  )
                }
                className="btn btn-accent dark:border-violet-400 text-white btn-square btn-sm h-10 w-10"
              >
                <i className="bi-person-add text-xl"></i>
              </div>
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

              <div className="divider my-0 last:hidden h-[3px]"></div>

              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e, i) => {
                  const roleLabel =
                    e.canCreate && e.canUpdate && e.canDelete
                      ? t("admin")
                      : e.canCreate && !e.canUpdate && !e.canDelete
                        ? t("contributor")
                        : !e.canCreate && !e.canUpdate && !e.canDelete
                          ? t("viewer")
                          : undefined;

                  return (
                    <React.Fragment key={i}>
                      <div className="relative p-3 bg-base-200 rounded-xl flex gap-2 justify-between border-none">
                        <div
                          className={"flex items-center justify-between w-full"}
                        >
                          <div className={"flex items-center"}>
                            <div className={"shrink-0"}>
                              <ProfilePhoto
                                src={e.user.image ? e.user.image : undefined}
                                name={e.user.name}
                              />
                            </div>
                            <div className={"grow ml-2"}>
                              <p className="text-sm font-semibold">
                                {e.user.name}
                              </p>
                              <p className="text-xs text-neutral">
                                @{e.user.username}
                              </p>
                            </div>
                          </div>

                          <div className={"flex items-center gap-2"}>
                            {permissions === true && !isPublicRoute ? (
                              <div className="dropdown dropdown-bottom dropdown-end">
                                <div
                                  tabIndex={0}
                                  role="button"
                                  onMouseDown={dropdownTriggerer}
                                  className="btn btn-sm btn-primary font-normal"
                                >
                                  {roleLabel}
                                  <i className="bi-chevron-down"></i>
                                </div>
                                <ul className="dropdown-content z-[30] menu shadow bg-base-200 border border-neutral-content rounded-xl mt-1">
                                  <li>
                                    <label
                                      className="label cursor-pointer flex justify-start"
                                      tabIndex={0}
                                      role="button"
                                    >
                                      <input
                                        type="radio"
                                        name={`role-radio-${e.userId}`}
                                        className="radio checked:bg-primary"
                                        checked={
                                          !e.canCreate &&
                                          !e.canUpdate &&
                                          !e.canDelete
                                        }
                                        onChange={() => {
                                          const updatedMember = {
                                            ...e,
                                            canCreate: false,
                                            canUpdate: false,
                                            canDelete: false,
                                          };
                                          const updatedMembers =
                                            collection.members.map((member) =>
                                              member.userId === e.userId
                                                ? updatedMember
                                                : member
                                            );
                                          setCollection({
                                            ...collection,
                                            members: updatedMembers,
                                          });
                                          (
                                            document?.activeElement as HTMLElement
                                          )?.blur();
                                        }}
                                      />
                                      <div>
                                        <p className="font-bold whitespace-nowrap">
                                          {t("viewer")}
                                        </p>
                                        <p className="whitespace-nowrap">
                                          {t("viewer_desc")}
                                        </p>
                                      </div>
                                    </label>
                                  </li>
                                  <li>
                                    <label
                                      className="label cursor-pointer flex justify-start"
                                      tabIndex={0}
                                      role="button"
                                    >
                                      <input
                                        type="radio"
                                        name={`role-radio-${e.userId}`}
                                        className="radio checked:bg-primary"
                                        checked={
                                          e.canCreate &&
                                          !e.canUpdate &&
                                          !e.canDelete
                                        }
                                        onChange={() => {
                                          const updatedMember = {
                                            ...e,
                                            canCreate: true,
                                            canUpdate: false,
                                            canDelete: false,
                                          };
                                          const updatedMembers =
                                            collection.members.map((member) =>
                                              member.userId === e.userId
                                                ? updatedMember
                                                : member
                                            );
                                          setCollection({
                                            ...collection,
                                            members: updatedMembers,
                                          });
                                          (
                                            document?.activeElement as HTMLElement
                                          )?.blur();
                                        }}
                                      />
                                      <div>
                                        <p className="font-bold whitespace-nowrap">
                                          {t("contributor")}
                                        </p>
                                        <p className="whitespace-nowrap">
                                          {t("contributor_desc")}
                                        </p>
                                      </div>
                                    </label>
                                  </li>
                                  <li>
                                    <label
                                      className="label cursor-pointer flex justify-start"
                                      tabIndex={0}
                                      role="button"
                                    >
                                      <input
                                        type="radio"
                                        name={`role-radio-${e.userId}`}
                                        className="radio checked:bg-primary"
                                        checked={
                                          e.canCreate &&
                                          e.canUpdate &&
                                          e.canDelete
                                        }
                                        onChange={() => {
                                          const updatedMember = {
                                            ...e,
                                            canCreate: true,
                                            canUpdate: true,
                                            canDelete: true,
                                          };
                                          const updatedMembers =
                                            collection.members.map((member) =>
                                              member.userId === e.userId
                                                ? updatedMember
                                                : member
                                            );
                                          setCollection({
                                            ...collection,
                                            members: updatedMembers,
                                          });
                                          (
                                            document?.activeElement as HTMLElement
                                          )?.blur();
                                        }}
                                      />
                                      <div>
                                        <p className="font-bold whitespace-nowrap">
                                          {t("admin")}
                                        </p>
                                        <p className="whitespace-nowrap">
                                          {t("admin_desc")}
                                        </p>
                                      </div>
                                    </label>
                                  </li>
                                </ul>
                              </div>
                            ) : (
                              <p className="text-sm text-neutral">
                                {roleLabel}
                              </p>
                            )}

                            {permissions === true && !isPublicRoute && (
                              <i
                                className={
                                  "bi-x text-xl btn btn-sm btn-square btn-ghost text-neutral hover:text-red-500 dark:hover:text-red-500 duration-100 cursor-pointer"
                                }
                                title={t("remove_member")}
                                onClick={() => {
                                  const updatedMembers =
                                    collection.members.filter((member) => {
                                      return (
                                        member.user.username !== e.user.username
                                      );
                                    });
                                  setCollection({
                                    ...collection,
                                    members: updatedMembers,
                                  });
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="divider my-0 last:hidden h-[3px]"></div>
                    </React.Fragment>
                  );
                })}
            </div>
          </>
        )}

        {permissions === true && !isPublicRoute && (
          <button
            className="btn btn-accent dark:border-violet-400 text-white w-fit ml-auto mt-3"
            onClick={submit}
          >
            {t("save_changes")}
          </button>
        )}
      </div>
    </Modal>
  );
}
