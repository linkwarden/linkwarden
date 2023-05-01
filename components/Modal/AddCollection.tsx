// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faPlus } from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { NewCollection } from "@/types/global";
import { useSession } from "next-auth/react";
import RequiredBadge from "../RequiredBadge";

type Props = {
  toggleCollectionModal: Function;
};

export default function AddCollection({ toggleCollectionModal }: Props) {
  const [newCollection, setNewCollection] = useState<NewCollection>({
    name: "",
    description: "",
    members: [],
  });

  const [memberEmail, setMemberEmail] = useState("");

  const { addCollection } = useCollectionStore();

  const session = useSession();

  const submit = async () => {
    console.log(newCollection);

    const response = await addCollection(newCollection as NewCollection);

    if (response) toggleCollectionModal();
  };

  const getUserByEmail = async (email: string) => {
    const response = await fetch(`/api/routes/users?email=${email}`);

    const data = await response.json();

    return data.response;
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="font-bold text-sky-300 mb-2 text-center">New Collection</p>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">
          Name
          <RequiredBadge />
        </p>
        <input
          value={newCollection.name}
          onChange={(e) =>
            setNewCollection({ ...newCollection, name: e.target.value })
          }
          type="text"
          placeholder="e.g. Example Collection"
          className="w-56 sm:w-96 rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Description</p>
        <input
          value={newCollection.description}
          onChange={(e) =>
            setNewCollection({ ...newCollection, description: e.target.value })
          }
          type="text"
          placeholder="Collection description"
          className="w-56 sm:w-96 rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      <hr className="border rounded my-2" />

      <div className="flex gap-5 items-center justify-between">
        <p className="text-sm font-bold text-sky-300">Members</p>
        <input
          value={memberEmail}
          onChange={(e) => {
            setMemberEmail(e.target.value);
          }}
          onKeyDown={async (e) => {
            const checkIfMemberAlreadyExists = newCollection.members.find(
              (e) => e.email === memberEmail
            );

            const ownerEmail = session.data?.user.email;

            if (
              e.key === "Enter" &&
              // no duplicate members
              !checkIfMemberAlreadyExists &&
              // member can't be empty
              memberEmail.trim() !== "" &&
              // member can't be the owner
              memberEmail.trim() !== ownerEmail
            ) {
              // Lookup, get data/err, list ...
              const user = await getUserByEmail(memberEmail.trim());

              if (user.email) {
                const newMember = {
                  name: user.name,
                  email: user.email,
                  canCreate: false,
                  canUpdate: false,
                  canDelete: false,
                };

                setNewCollection({
                  ...newCollection,
                  members: [...newCollection.members, newMember],
                });

                setMemberEmail("");
              }
            }
          }}
          type="text"
          placeholder="Email"
          className="w-56 sm:w-96 rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />
      </div>

      {newCollection.members[0] ? (
        <p className="text-center text-sky-500 text-xs sm:text-sm">
          (All Members will have <b>Read</b> access to this collection.)
        </p>
      ) : null}

      {newCollection.members.map((e, i) => {
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
                const updatedMembers = newCollection.members.filter(
                  (member) => {
                    return member.email !== e.email;
                  }
                );
                setNewCollection({
                  ...newCollection,
                  members: updatedMembers,
                });
              }}
            />
            <div>
              <p className="text-sm font-bold text-sky-500">{e.name}</p>
              <p className="text-sky-900">{e.email}</p>
            </div>
            <div className="flex sm:block items-center gap-5">
              <div>
                <p className="font-bold text-sm text-gray-500">Permissions</p>
                <p className="text-xs text-gray-400 mb-2">(Click to toggle.)</p>
              </div>

              <div>
                <label className="cursor-pointer mr-1">
                  <input
                    type="checkbox"
                    id="canCreate"
                    className="peer sr-only"
                    checked={e.canCreate}
                    onChange={() => {
                      const updatedMembers = newCollection.members.map(
                        (member) => {
                          if (member.email === e.email) {
                            return { ...member, canCreate: !e.canCreate };
                          }
                          return member;
                        }
                      );
                      setNewCollection({
                        ...newCollection,
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
                      const updatedMembers = newCollection.members.map(
                        (member) => {
                          if (member.email === e.email) {
                            return { ...member, canUpdate: !e.canUpdate };
                          }
                          return member;
                        }
                      );
                      setNewCollection({
                        ...newCollection,
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
                      const updatedMembers = newCollection.members.map(
                        (member) => {
                          if (member.email === e.email) {
                            return { ...member, canDelete: !e.canDelete };
                          }
                          return member;
                        }
                      );
                      setNewCollection({
                        ...newCollection,
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

      <div
        className="mx-auto mt-2 bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
        onClick={submit}
      >
        <FontAwesomeIcon icon={faPlus} className="h-5" />
        Add Collection
      </div>
    </div>
  );
}
