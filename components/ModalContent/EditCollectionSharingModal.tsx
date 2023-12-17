import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast, { Toaster } from "react-hot-toast";
import {
  faClose,
  faCrown,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CollectionIncludingMembersAndLinkCount, Member } from "@/types/global";
import getPublicUserData from "@/lib/client/getPublicUserData";
import useAccountStore from "@/store/account";
import usePermissions from "@/hooks/usePermissions";
import ProfilePhoto from "../ProfilePhoto";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import Modal from "../Modal";

type Props = {
  onClose: Function;
  activeCollection: CollectionIncludingMembersAndLinkCount;
};

export default function EditCollectionSharingModal({
  onClose,
  activeCollection,
}: Props) {
  useEffect(() => {
    const fetchOwner = async () => {
      const owner = await getPublicUserData(collection.ownerId as number);
      setCollectionOwner(owner);
    };

    fetchOwner();

    setCollection(activeCollection);
  }, []);

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(activeCollection);

  const [submitLoader, setSubmitLoader] = useState(false);
  const { updateCollection } = useCollectionStore();

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);
      if (!collection) return null;

      setSubmitLoader(true);

      const load = toast.loading("Updating...");

      let response;

      response = await updateCollection(collection as any);

      toast.dismiss(load);

      if (response.ok) {
        toast.success(`Updated!`);
        onClose();
      } else toast.error(response.data as string);

      setSubmitLoader(false);
    }
  };

  const { account } = useAccountStore();
  const permissions = usePermissions(collection.id as number);

  const currentURL = new URL(document.URL);

  const publicCollectionURL = `${currentURL.origin}/public/collections/${collection.id}`;

  const [memberUsername, setMemberUsername] = useState("");

  const [collectionOwner, setCollectionOwner] = useState({
    id: null,
    name: "",
    username: "",
    image: "",
  });

  const setMemberState = (newMember: Member) => {
    if (!collection) return null;

    setCollection({
      ...collection,
      members: [...collection.members, newMember],
    });

    setMemberUsername("");
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">
        {permissions === true ? "Share and Collaborate" : "Team"}
      </p>

      <div className="divider mb-3 mt-1"></div>

      <div className="flex flex-col gap-3">
        {permissions === true && (
          <div>
            <p>Make Public</p>

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
              <span className="label-text">Make this a public collection</span>
            </label>

            <p className="text-neutral text-sm">
              This will let <b>Anyone</b> to view this collection and it&apos;s
              users.
            </p>
          </div>
        )}

        {collection.isPublic ? (
          <div className={permissions === true ? "pl-5" : ""}>
            <p className="mb-2">Sharable Link (Click to copy)</p>
            <div
              onClick={() => {
                try {
                  navigator.clipboard
                    .writeText(publicCollectionURL)
                    .then(() => toast.success("Copied!"));
                } catch (err) {
                  console.log(err);
                }
              }}
              className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-2 bg-base-200 border-neutral-content border-solid border outline-none hover:border-primary dark:hover:border-primary duration-100 cursor-text"
            >
              {publicCollectionURL}
            </div>
          </div>
        ) : null}

        {permissions === true && <div className="divider my-3"></div>}

        {permissions === true && (
          <>
            <p>Member Management</p>

            <div className="flex items-center gap-2">
              <TextInput
                value={memberUsername || ""}
                className="bg-base-200"
                placeholder="Username (without the '@')"
                onChange={(e) => setMemberUsername(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  addMemberToCollection(
                    account.username as string,
                    memberUsername || "",
                    collection,
                    setMemberState
                  )
                }
              />

              <div
                onClick={() =>
                  addMemberToCollection(
                    account.username as string,
                    memberUsername || "",
                    collection,
                    setMemberState
                  )
                }
                className="btn btn-accent text-white btn-square btn-sm h-10 w-10"
              >
                  <i className="bi-person-add text-xl"></i>
              </div>
            </div>
          </>
        )}

        {collection?.members[0]?.user && (
          <>
            {permissions === true ? (
              <p className="text-center text-neutral text-xs sm:text-sm">
                (All Members have <b>Read</b> access to this collection.)
              </p>
            ) : (
              <p>
                Here are all the members who are collaborating on this
                collection.
              </p>
            )}

            <div className="flex flex-col gap-3 rounded-md">
              <div
                className="relative border px-2 rounded-xl border-neutral-content bg-base-200 flex min-h-[6rem] sm:min-h-[4.1rem] gap-2 justify-between"
                title={`@${collectionOwner.username} is the owner of this collection.`}
              >
                <div className="flex items-center gap-2 w-full">
                  <ProfilePhoto
                    src={
                      collectionOwner.image ? collectionOwner.image : undefined
                    }
                    name={collectionOwner.name}
                  />
                  <div className="w-full">
                    <div className="flex items-center gap-1 w-full justify-between">
                      <p className="text-sm font-bold">
                        {collectionOwner.name}
                      </p>
                      <div className="flex text-xs gap-1 items-center">
                        <FontAwesomeIcon
                          icon={faCrown}
                          className="w-3 h-3 text-yellow-500"
                        />
                        Admin
                      </div>
                    </div>
                    <p className="text-neutral">@{collectionOwner.username}</p>
                  </div>
                </div>
              </div>

              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e, i) => {
                  return (
                    <div
                      key={i}
                      className="relative border p-2 rounded-xl border-neutral-content bg-base-200 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                    >
                      {permissions === true && (
                        <FontAwesomeIcon
                          icon={faClose}
                          className="absolute right-2 top-2 text-neutral h-4 hover:text-red-500 dark:hover:text-red-500 duration-100 cursor-pointer"
                          title="Remove Member"
                          onClick={() => {
                            const updatedMembers = collection.members.filter(
                              (member) => {
                                return member.user.username !== e.user.username;
                              }
                            );
                            setCollection({
                              ...collection,
                              members: updatedMembers,
                            });
                          }}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <ProfilePhoto
                          src={e.user.image ? e.user.image : undefined}
                          name={e.user.name}
                        />
                        <div>
                          <p className="text-sm font-bold">{e.user.name}</p>
                          <p className="text-neutral">@{e.user.username}</p>
                        </div>
                      </div>
                      <div className="flex sm:block items-center justify-between gap-5 min-w-[10rem]">
                        <div>
                          <p
                            className={`font-bold text-sm ${
                              permissions === true ? "" : "mb-2"
                            }`}
                          >
                            Permissions
                          </p>
                          {permissions === true && (
                            <p className="text-xs text-neutral mb-2">
                              (Click to toggle.)
                            </p>
                          )}
                        </div>

                        {permissions !== true &&
                        !e.canCreate &&
                        !e.canUpdate &&
                        !e.canDelete ? (
                          <p className="text-sm text-neutral">
                            Has no permissions.
                          </p>
                        ) : (
                          <div>
                            <label
                              className={
                                permissions === true
                                  ? "cursor-pointer mr-1"
                                  : "mr-1"
                              }
                            >
                              <input
                                type="checkbox"
                                id="canCreate"
                                className="peer sr-only"
                                checked={e.canCreate}
                                onChange={() => {
                                  if (permissions === true) {
                                    const updatedMembers =
                                      collection.members.map((member) => {
                                        if (
                                          member.user.username ===
                                          e.user.username
                                        ) {
                                          return {
                                            ...member,
                                            canCreate: !e.canCreate,
                                          };
                                        }
                                        return member;
                                      });
                                    setCollection({
                                      ...collection,
                                      members: updatedMembers,
                                    });
                                  }
                                }}
                              />
                              <span
                                className={`peer-checked:bg-primary peer-checked:text-primary-content text-sm ${
                                  permissions === true
                                    ? "hover:bg-neutral-content duration-100"
                                    : ""
                                } rounded p-1 select-none`}
                              >
                                Create
                              </span>
                            </label>

                            <label
                              className={
                                permissions === true
                                  ? "cursor-pointer mr-1"
                                  : "mr-1"
                              }
                            >
                              <input
                                type="checkbox"
                                id="canUpdate"
                                className="peer sr-only"
                                checked={e.canUpdate}
                                onChange={() => {
                                  if (permissions === true) {
                                    const updatedMembers =
                                      collection.members.map((member) => {
                                        if (
                                          member.user.username ===
                                          e.user.username
                                        ) {
                                          return {
                                            ...member,
                                            canUpdate: !e.canUpdate,
                                          };
                                        }
                                        return member;
                                      });
                                    setCollection({
                                      ...collection,
                                      members: updatedMembers,
                                    });
                                  }
                                }}
                              />
                              <span
                                className={`peer-checked:bg-primary peer-checked:text-primary-content text-sm ${
                                  permissions === true
                                    ? "hover:bg-neutral-content duration-100"
                                    : ""
                                } rounded p-1 select-none`}
                              >
                                Update
                              </span>
                            </label>

                            <label
                              className={
                                permissions === true
                                  ? "cursor-pointer mr-1"
                                  : "mr-1"
                              }
                            >
                              <input
                                type="checkbox"
                                id="canDelete"
                                className="peer sr-only"
                                checked={e.canDelete}
                                onChange={() => {
                                  if (permissions === true) {
                                    const updatedMembers =
                                      collection.members.map((member) => {
                                        if (
                                          member.user.username ===
                                          e.user.username
                                        ) {
                                          return {
                                            ...member,
                                            canDelete: !e.canDelete,
                                          };
                                        }
                                        return member;
                                      });
                                    setCollection({
                                      ...collection,
                                      members: updatedMembers,
                                    });
                                  }
                                }}
                              />
                              <span
                                className={`peer-checked:bg-primary peer-checked:text-primary-content text-sm ${
                                  permissions === true
                                    ? "hover:bg-neutral-content duration-100"
                                    : ""
                                } rounded p-1 select-none`}
                              >
                                Delete
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {permissions === true && (
          <button
            className="btn btn-accent dark:border-violet-400 text-white w-fit ml-auto mt-3"
            onClick={submit}
          >
            Save
          </button>
        )}
      </div>
    </Modal>
  );
}
