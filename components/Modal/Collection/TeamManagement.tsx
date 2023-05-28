// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faPenToSquare,
  faUser,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { CollectionIncludingMembers, Member } from "@/types/global";
import { useSession } from "next-auth/react";
import addMemberToCollection from "@/lib/client/addMemberToCollection";
import ImageWithFallback from "../../ImageWithFallback";
import Checkbox from "../../Checkbox";

type Props = {
  toggleCollectionModal: Function;
  activeCollection: CollectionIncludingMembers;
};

export default function TeamManagement({
  toggleCollectionModal,
  activeCollection,
}: Props) {
  const [collection, setCollection] =
    useState<CollectionIncludingMembers>(activeCollection);

  const [isPublic, setIsPublic] = useState(false);

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

  const { updateCollection } = useCollectionStore();

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

    const response = await updateCollection(collection);

    if (response) toggleCollectionModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center w-5/6 mx-auto">
        Sharing & Collaboration Settings
      </p>

      <p className="text-sm font-bold text-sky-300">Make Public</p>

      <Checkbox
        label="Make this a public collection."
        state={isPublic}
        onClick={() => setIsPublic(!isPublic)}
      />

      <p className="text-gray-500 text-sm">
        This will let <b>Anyone</b> to view this collection.
      </p>

      {isPublic ? (
        <div>
          <p className="mb-2 text-gray-500">Public Link (Click to copy)</p>
          <div
            onClick={() =>
              navigator.clipboard
                .writeText(publicCollectionURL)
                .then(() => console.log("Copied!"))
            }
            className="w-full hide-scrollbar overflow-x-auto whitespace-nowrap rounded-md p-3 border-sky-100 border-solid border outline-none hover:border-sky-500 duration-100 cursor-text"
          >
            {publicCollectionURL}
          </div>
        </div>
      ) : null}

      <hr />

      <p className="text-sm font-bold text-sky-300">Member Management</p>

      <div className="relative">
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
          className="w-full rounded-md p-3 pr-12 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
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
          className="absolute flex items-center justify-center right-2 top-2 bottom-2 bg-sky-500 hover:bg-sky-400 duration-100 text-white w-9 rounded-md cursor-pointer"
        >
          <FontAwesomeIcon icon={faUserPlus} className="w-6 h-6" />
        </div>
      </div>
      {collection?.members[0]?.user ? (
        <>
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            (All Members have <b>Read</b> access to this collection.)
          </p>

          <div className="max-h-[20rem] overflow-auto flex flex-col gap-3 rounded-md shadow-inner">
            {collection.members.map((e, i) => {
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
                    <ImageWithFallback
                      key={i}
                      src={`/api/avatar/${e.userId}`}
                      className="h-10 w-10 shadow rounded-full border-[3px] border-sky-100"
                    >
                      <div className="text-white bg-sky-500 h-10 w-10 shadow rounded-full border-[3px] border-sky-100 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                      </div>
                    </ImageWithFallback>
                    <div>
                      <p className="text-sm font-bold text-sky-500">
                        {e.user.name}
                      </p>
                      <p className="text-sky-900">{e.user.email}</p>
                    </div>
                  </div>
                  <div className="flex sm:block items-center gap-5">
                    <div>
                      <p className="font-bold text-sm text-gray-500">
                        Permissions
                      </p>
                      <p className="text-xs text-gray-400 mb-2">
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
                                  return { ...member, canCreate: !e.canCreate };
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
                        <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
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
                                  return { ...member, canUpdate: !e.canUpdate };
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
                        <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
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
                                  return { ...member, canDelete: !e.canDelete };
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
                        <span className="text-sky-900 peer-checked:bg-sky-500 text-sm hover:bg-sky-200 duration-75 peer-checked:text-white rounded p-1 select-none">
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
      ) : null}

      <div className="flex flex-col justify-center items-center gap-2 mt-2">
        <div
          className="bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
          onClick={submit}
        >
          <FontAwesomeIcon icon={faPenToSquare} className="h-5" />
          Edit Collection
        </div>
      </div>
    </div>
  );
}
