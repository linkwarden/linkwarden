import React, { useEffect, useState } from "react";
import TextInput from "@/components/TextInput";
import useCollectionStore from "@/store/collections";
import toast from "react-hot-toast";
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
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

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
            <p>Members</p>

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
                className="btn btn-accent dark:border-violet-400 text-white btn-square btn-sm h-10 w-10"
              >
                <i className="bi-person-add text-xl"></i>
              </div>
            </div>
          </>
        )}

        {collection?.members[0]?.user && (
          <>
            <div
              className="flex flex-col divide-y divide-neutral-content border border-neutral-content rounded-xl overflow-hidden ">
              <div
                className="relative p-3 bg-base-200 flex gap-2 justify-between"
                title={`@${collectionOwner.username} is the owner of this collection.`}
              >
                <div className={"flex items-center justify-between w-full"}>
                  <div className={"flex items-center"}>
                    <div className={"shrink-0"}>
                      <ProfilePhoto
                        src={collectionOwner.image ? collectionOwner.image : undefined}
                        name={collectionOwner.name}
                      />
                    </div>
                    <div className={"grow ml-2"}>
                      <p className="text-sm font-semibold">{collectionOwner.name}</p>
                      <p className="text-xs text-neutral">@{collectionOwner.username}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-neutral">
                      Owner
                    </p>
                  </div>
                </div>
              </div>

              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e, i) => {
                  return (
                    <div
                      key={i}
                      className="relative p-3 bg-base-200 flex gap-2 justify-between"
                    >
                      <div className={"flex items-center justify-between w-full"}>
                        <div className={"flex items-center"}>
                          <div className={"shrink-0"}>
                            <ProfilePhoto
                              src={e.user.image ? e.user.image : undefined}
                              name={e.user.name}
                            />
                          </div>
                          <div className={"grow ml-2"}>
                            <p className="text-sm font-semibold">{e.user.name}</p>
                            <p className="text-xs text-neutral">@{e.user.username}</p>
                          </div>
                        </div>

                        <div className={"flex items-center gap-2"}>
                          {permissions === true && (
                            <i
                              className={"bi-x text-xl btn btn-sm text-neutral hover:text-red-500 dark:hover:text-red-500 duration-100 cursor-pointer"}
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

                          <div>
                            {permissions === true ? (
                              <select
                                onChange={(evt) => {
                                  if (permissions !== true) return;

                                  switch (evt.target.value) {
                                    case 'admin':
                                      collection.members[i].canCreate = true;
                                      collection.members[i].canUpdate = true;
                                      collection.members[i].canDelete = true;
                                      break;
                                    case 'contributor':
                                      collection.members[i].canCreate = true;
                                      collection.members[i].canUpdate = false;
                                      collection.members[i].canDelete = false;
                                      break;
                                    default:
                                      collection.members[i].canCreate = false;
                                      collection.members[i].canUpdate = false;
                                      collection.members[i].canDelete = false;
                                      break;
                                  }
                                }}
                                className="select select-bordered select-sm w-full max-w-xs">
                                <option value={'viewer'}
                                        selected={!e.canCreate && !e.canUpdate && !e.canDelete}>
                                  Viewer
                                </option>
                                <option value={'contributor'}
                                        selected={e.canCreate && !e.canUpdate && !e.canDelete}>
                                  Contributor
                                </option>
                                <option value={'admin'} selected={e.canCreate && e.canUpdate && e.canDelete}>
                                  Admin
                                </option>
                              </select>
                            ) : (
                              <p className="text-sm text-neutral">
                                {
                                  (e.canCreate && e.canUpdate && e.canDelete)
                                    ? "Admin"
                                    : (e.canCreate)
                                      ? 'Contributor'
                                      : 'Viewer'
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
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
