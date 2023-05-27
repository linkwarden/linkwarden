// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPenToSquare,
  faTrashCan,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { CollectionIncludingMembers } from "@/types/global";
import useLinkStore from "@/store/links";
import ImageWithFallback from "./ImageWithFallback";
import Dropdown from "./Dropdown";
import { useState } from "react";
import Modal from "@/components/Modal";
import EditCollection from "@/components/Modal/EditCollection";
import DeleteCollection from "@/components/Modal/DeleteCollection";

export default function ({
  collection,
}: {
  collection: CollectionIncludingMembers;
}) {
  const { links } = useLinkStore();
  const formattedDate = new Date(
    collection.createdAt as unknown as string
  ).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const [expandDropdown, setExpandDropdown] = useState(false);
  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);

  const toggleEditCollectionModal = () => {
    setEditCollectionModal(!editCollectionModal);
  };

  const toggleDeleteCollectionModal = () => {
    setDeleteCollectionModal(!deleteCollectionModal);
  };

  return (
    <div className="bg-gradient-to-tr from-sky-100 from-10% via-gray-100 via-20% self-stretch min-h-[12rem] rounded-md shadow duration-100 hover:shadow-none group relative">
      <div
        onClick={() => setExpandDropdown(!expandDropdown)}
        id="edit-dropdown"
        className="inline-flex absolute top-5 right-5 rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
      >
        <FontAwesomeIcon
          icon={faEllipsis}
          id="edit-dropdown"
          className="w-5 h-5 text-gray-500"
        />
      </div>
      <Link href={`/collections/${collection.id}`}>
        <div className="flex flex-col gap-2 justify-between h-full select-none p-5 cursor-pointer">
          <p className="text-2xl font-bold capitalize text-sky-600 break-words w-4/5">
            {collection.name}
          </p>
          <div className="flex justify-between items-center">
            <div className="text-sky-400 flex items-center w-full">
              {collection.members
                .sort((a, b) => (a.user.id as number) - (b.user.id as number))
                .map((e, i) => {
                  return (
                    <ImageWithFallback
                      key={i}
                      src={`/api/avatar/${e.userId}`}
                      className="h-10 w-10 shadow rounded-full border-[3px] border-sky-100 -mr-3"
                    >
                      <div className="text-white bg-sky-500 h-10 w-10 shadow rounded-full border-[3px] border-sky-100 -mr-3 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
                      </div>
                    </ImageWithFallback>
                  );
                })
                .slice(0, 4)}
              {collection.members.length - 4 > 0 ? (
                <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-500 border-sky-100 -mr-3">
                  +{collection.members.length - 3}
                </div>
              ) : null}
            </div>
            <div className="text-right w-40">
              <p className="text-sky-500 font-bold text-sm">
                {links.filter((e) => e.collectionId === collection.id).length}{" "}
                Links
              </p>
              <p className="text-gray-500 font-bold text-xs">{formattedDate}</p>
            </div>
          </div>
        </div>
      </Link>

      {expandDropdown ? (
        <Dropdown
          items={[
            {
              name: "Edit Collection",
              icon: <FontAwesomeIcon icon={faPenToSquare} />,
              onClick: () => {
                toggleEditCollectionModal();
                setExpandDropdown(false);
              },
            },
            {
              name: "Delete Collection",
              icon: <FontAwesomeIcon icon={faTrashCan} />,
              onClick: () => {
                toggleDeleteCollectionModal();
                setExpandDropdown(false);
              },
            },
          ]}
          onClickOutside={(e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.id !== "edit-dropdown") setExpandDropdown(false);
          }}
          className="absolute top-[3.2rem] right-5 z-10 w-44"
        />
      ) : null}

      {editCollectionModal ? (
        <Modal toggleModal={toggleEditCollectionModal}>
          <EditCollection
            toggleCollectionModal={toggleEditCollectionModal}
            activeCollection={collection}
          />
        </Modal>
      ) : null}

      {deleteCollectionModal ? (
        <Modal toggleModal={toggleDeleteCollectionModal}>
          <DeleteCollection
            collection={collection}
            toggleDeleteCollectionModal={toggleDeleteCollectionModal}
          />
        </Modal>
      ) : null}
    </div>
  );
}
