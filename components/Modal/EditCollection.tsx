// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faPenToSquare,
  faPlus,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import useCollectionStore from "@/store/collections";
import { ExtendedCollection } from "@/types/global";
import { useSession } from "next-auth/react";
import Modal from "@/components/Modal";
import DeleteCollection from "@/components/Modal/DeleteCollection";
import RequiredBadge from "../RequiredBadge";
import addMemberToCollection from "@/lib/client/addMemberToCollection";

type Props = {
  toggleCollectionModal: Function;
  collection: ExtendedCollection;
};

export default function EditCollection({
  toggleCollectionModal,
  collection,
}: Props) {
  const [activeCollection, setActiveCollection] =
    useState<ExtendedCollection>(collection);

  const [memberEmail, setMemberEmail] = useState("");

  const { updateCollection } = useCollectionStore();

  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);

  const toggleDeleteCollectionModal = () => {
    setDeleteCollectionModal(!deleteCollectionModal);
  };

  const session = useSession();

  const setMemberState = (newMember: any) => {
    setActiveCollection({
      ...activeCollection,
      members: [...activeCollection.members, newMember],
    });

    setMemberEmail("");
  };

  const submit = async () => {
    console.log(activeCollection);

    const response = await updateCollection(
      activeCollection as ExtendedCollection
    );

    if (response) toggleCollectionModal();
  };

  return (
    <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
      <p className="text-xl text-sky-500 mb-2 text-center">Edit Collection</p>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full">
          <p className="text-sm font-bold text-sky-300 mb-2">
            Name
            <RequiredBadge />
          </p>
          <input
            value={activeCollection.name}
            onChange={(e) =>
              setActiveCollection({ ...activeCollection, name: e.target.value })
            }
            type="text"
            placeholder="e.g. Example Collection"
            className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>

        <div className="w-full">
          <p className="text-sm font-bold text-sky-300 mb-2">Description</p>
          <input
            value={activeCollection.description}
            onChange={(e) =>
              setActiveCollection({
                ...activeCollection,
                description: e.target.value,
              })
            }
            type="text"
            placeholder="Collection description"
            className="w-full rounded-md p-3 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
          />
        </div>
      </div>

      <hr className="border rounded my-2" />

      <p className="text-sm font-bold text-sky-300">Members</p>
      <div className="relative">
        <input
          value={memberEmail}
          onChange={(e) => {
            setMemberEmail(e.target.value);
          }}
          type="text"
          placeholder="Email"
          className="w-full rounded-md p-3 pr-12 border-sky-100 border-solid border outline-none focus:border-sky-500 duration-100"
        />

        <div
          onClick={() =>
            addMemberToCollection(
              session.data?.user.email as string,
              memberEmail,
              activeCollection,
              setMemberState,
              "UPDATE"
            )
          }
          className="absolute flex items-center justify-center right-2 top-2 bottom-2 bg-sky-500 hover:bg-sky-400 duration-100 text-white w-9 rounded-md cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
        </div>
      </div>
      {activeCollection.members[0] ? (
        <p className="text-center text-gray-500 text-xs sm:text-sm">
          (All Members will have <b>Read</b> access to this collection.)
        </p>
      ) : null}

      {activeCollection.members.map((e, i) => {
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
                const updatedMembers = activeCollection.members.filter(
                  (member) => {
                    return member.user.email !== e.user.email;
                  }
                );
                setActiveCollection({
                  ...activeCollection,
                  members: updatedMembers,
                });
              }}
            />
            <div className="flex items-center gap-2">
              <img
                // @ts-ignore
                src={`/api/avatar/${e.userId}`}
                className="h-10 w-10 rounded-full border border-sky-100"
                alt=""
              />
              <div>
                <p className="text-sm font-bold text-sky-500">{e.user.name}</p>
                <p className="text-sky-900">{e.user.email}</p>
              </div>
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
                      const updatedMembers = activeCollection.members.map(
                        (member) => {
                          if (member.user.email === e.user.email) {
                            return { ...member, canCreate: !e.canCreate };
                          }
                          return member;
                        }
                      );
                      setActiveCollection({
                        ...activeCollection,
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
                      const updatedMembers = activeCollection.members.map(
                        (member) => {
                          if (member.user.email === e.user.email) {
                            return { ...member, canUpdate: !e.canUpdate };
                          }
                          return member;
                        }
                      );
                      setActiveCollection({
                        ...activeCollection,
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
                      const updatedMembers = activeCollection.members.map(
                        (member) => {
                          if (member.user.email === e.user.email) {
                            return { ...member, canDelete: !e.canDelete };
                          }
                          return member;
                        }
                      );
                      setActiveCollection({
                        ...activeCollection,
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

      <div className="flex flex-col justify-center items-center gap-2 mt-2">
        <div
          className="bg-sky-500 text-white flex items-center gap-2 py-2 px-5 rounded-md select-none font-bold cursor-pointer duration-100 hover:bg-sky-400"
          onClick={submit}
        >
          <FontAwesomeIcon icon={faPenToSquare} className="h-5" />
          Edit Collection
        </div>

        <div className="flex items-center justify-center gap-2">
          <hr className="w-16 border" />

          <p className="text-gray-400 font-bold">OR</p>

          <hr className="w-16 border" />
        </div>

        <div
          onClick={() => {
            toggleDeleteCollectionModal();
          }}
          className="w-fit inline-flex rounded-md cursor-pointer bg-red-500 hover:bg-red-400 duration-100 p-2"
        >
          <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4 text-white" />
        </div>
      </div>

      {deleteCollectionModal ? (
        <Modal toggleModal={toggleDeleteCollectionModal}>
          <DeleteCollection
            collection={activeCollection}
            toggleDeleteCollectionModal={toggleDeleteCollectionModal}
          />
        </Modal>
      ) : null}
    </div>
  );
}
