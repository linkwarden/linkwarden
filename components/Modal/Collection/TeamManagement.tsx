import { Dispatch, SetStateAction, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faPenToSquare,
  faPlus,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { CollectionIncludingMembersAndLinkCount, Member } from "@/types/global";
import { useSession } from "next-auth/react";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import Checkbox from "../../Checkbox";
import SubmitButton from "@/components/SubmitButton";
import ProfilePhoto from "@/components/ProfilePhoto";

type Props = {
  toggleCollectionModal: Function;
  setCollection: Dispatch<
    SetStateAction<CollectionIncludingMembersAndLinkCount>
  >;
  collection: CollectionIncludingMembersAndLinkCount;
  method: "CREATE" | "UPDATE";
};

export default function TeamManagement({
  toggleCollectionModal,
  setCollection,
  collection,
  method,
}: Props) {
  const currentURL = new URL(document.URL);

  const publicCollectionURL = `${currentURL.origin}/public/collections/${collection.id}`;

  const [member, setMember] = useState<Member>({
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    user: {
      name: "",
      email: "",
    },
  });

  const { addCollection, updateCollection } = useCollectionStore();

  const session = useSession();

  const setMemberState = (newMember: Member) => {
    if (!collection) return null;

    setCollection({
      ...collection,
      members: [...collection.members, newMember],
    });

    setMember({
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      user: {
        name: "",
        email: "",
      },
    });
  };

  const submit = async () => {
    if (!collection) return null;

    let response = null;

    if (method === "CREATE") response = await addCollection(collection);
    else if (method === "UPDATE") response = await updateCollection(collection);
    else console.log("Unknown method.");

    if (response) toggleCollectionModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-sm text-sky-500">Make Public</p>

      <Checkbox
        label="Make this a public collection."
        state={collection.isPublic}
        onClick={() =>
          setCollection({ ...collection, isPublic: !collection.isPublic })
        }
      />

      <p className="text-gray-500 text-sm">
        This will let <b>Anyone</b> to view this collection.
      </p>

      {collection.isPublic ? (
        <div>
          <p className="text-sm text-sky-500 mb-2">
            Public Link (Click to copy)
          </p>
          <div
            onClick={() => {
              try {
                navigator.clipboard
                  .writeText(publicCollectionURL)
                  .then(() => console.log("Copied!"));
              } catch (err) {
                console.log(err);
              }
            }}
            className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-3 border-sky-100 border-solid border outline-none hover:border-sky-500 duration-100 cursor-text"
          >
            {publicCollectionURL}
          </div>
        </div>
      ) : null}

      <hr />

      <p className="text-sm text-sky-500">Member Management</p>

      <div className="flex items-center gap-2">
        <input
          value={member.user.email}
          onChange={(e) => {
            setMember({
              ...member,
              user: { ...member.user, email: e.target.value },
            });
          }}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            addMemberToCollection(
              session.data?.user.email as string,
              member.user.email,
              collection,
              setMemberState
            )
          }
          type="text"
          placeholder="Email"
          className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <div
          onClick={() =>
            addMemberToCollection(
              session.data?.user.email as string,
              member.user.email,
              collection,
              setMemberState
            )
          }
          className="flex items-center justify-center bg-sky-500 hover:bg-sky-400 duration-100 text-white w-12 h-12 p-3 rounded-md cursor-pointer"
        >
          <FontAwesomeIcon icon={faUserPlus} className="w-5 h-5" />
        </div>
      </div>

      {collection?.members[0]?.user && (
        <>
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            (All Members have <b>Read</b> access to this collection.)
          </p>
          <div className="max-h-[20rem] overflow-auto flex flex-col gap-3 rounded-md shadow-inner">
            {collection.members
              .sort((a, b) => (a.userId as number) - (b.userId as number))
              .map((e, i) => {
                return (
                  <div
                    key={i}
                    className="relative border p-2 rounded-md border-sky-100 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
                  >
                    <FontAwesomeIcon
                      icon={faClose}
                      className="absolute right-2 top-2 text-gray-500 h-4 hover:text-red-500 duration-100 cursor-pointer"
                      title="Remove Member"
                      onClick={() => {
                        const updatedMembers = collection.members.filter(
                          (member) => {
                            return member.user.email !== e.user.email;
                          }
                        );
                        setCollection({
                          ...collection,
                          members: updatedMembers,
                        });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <ProfilePhoto src={`/api/avatar/${e.userId}`} />
                      <div>
                        <p className="text-sm font-bold text-sky-500">
                          {e.user.name}
                        </p>
                        <p className="text-sky-900">{e.user.email}</p>
                      </div>
                    </div>
                    <div className="flex sm:block items-center gap-5">
                      <div>
                        <p className="font-bold text-sm text-sky-500">
                          Permissions
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          (Click to toggle.)
                        </p>
                      </div>

                      <div>
                        <label className="cursor-pointer mr-1">
                          <input
                            type="checkbox"
                            id="canCreate"
                            className="peer sr-only"
                            checked={e.canCreate}
                            onChange={() => {
                              const updatedMembers = collection.members.map(
                                (member) => {
                                  if (member.user.email === e.user.email) {
                                    return {
                                      ...member,
                                      canCreate: !e.canCreate,
                                    };
                                  }
                                  return member;
                                }
                              );
                              setCollection({
                                ...collection,
                                members: updatedMembers,
                              });
                            }}
                          />
                          <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-slate-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                            Create
                          </span>
                        </label>

                        <label className="cursor-pointer mr-1">
                          <input
                            type="checkbox"
                            id="canUpdate"
                            className="peer sr-only"
                            checked={e.canUpdate}
                            onChange={() => {
                              const updatedMembers = collection.members.map(
                                (member) => {
                                  if (member.user.email === e.user.email) {
                                    return {
                                      ...member,
                                      canUpdate: !e.canUpdate,
                                    };
                                  }
                                  return member;
                                }
                              );
                              setCollection({
                                ...collection,
                                members: updatedMembers,
                              });
                            }}
                          />
                          <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-slate-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                            Update
                          </span>
                        </label>

                        <label className="cursor-pointer mr-1">
                          <input
                            type="checkbox"
                            id="canDelete"
                            className="peer sr-only"
                            checked={e.canDelete}
                            onChange={() => {
                              const updatedMembers = collection.members.map(
                                (member) => {
                                  if (member.user.email === e.user.email) {
                                    return {
                                      ...member,
                                      canDelete: !e.canDelete,
                                    };
                                  }
                                  return member;
                                }
                              );
                              setCollection({
                                ...collection,
                                members: updatedMembers,
                              });
                            }}
                          />
                          <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-slate-200 duration-75 peer-checked:text-white rounded p-1 select-none">
                            Delete
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <SubmitButton
        onClick={submit}
        label={method === "CREATE" ? "Add" : "Save"}
        icon={method === "CREATE" ? faPlus : faPenToSquare}
        className="mx-auto mt-2"
      />
    </div>
  );
}
