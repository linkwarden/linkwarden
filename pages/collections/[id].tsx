// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Dropdown from "@/components/Dropdown";
import LinkList from "@/components/LinkList";
import Modal from "@/components/Modal";
import AddLink from "@/components/Modal/AddLink";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { ExtendedLink } from "@/types/global";
import {
  faAdd,
  faEllipsis,
  faFolder,
  faPenToSquare,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Collection } from "@prisma/client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function () {
  const router = useRouter();

  const { links } = useLinkStore();
  const { collections } = useCollectionStore();

  const [expandDropdown, setExpandDropdown] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection>();
  const [linksByCollection, setLinksByCollection] =
    useState<ExtendedLink[]>(links);

  const toggleLinkModal = () => {
    setLinkModal(!linkModal);
  };

  useEffect(() => {
    setLinksByCollection(
      links.filter((e) => e.collection.id === Number(router.query.id))
    );

    setActiveCollection(
      collections.find((e) => e.id === Number(router.query.id))
    );
  }, [links, router, collections]);

  return (
    // ml-80
    <div className="p-5 flex flex-col gap-5 w-full">
      <div className="flex gap-3 items-center">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faFolder} className="w-5 h-5 text-sky-300" />
          <p className="text-lg text-sky-900">{activeCollection?.name}</p>
        </div>
        <div className="relative">
          <div
            onClick={() => setExpandDropdown(!expandDropdown)}
            id="edit-dropdown"
            className="inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              id="edit-dropdown"
              className="w-4 h-4 text-gray-500"
            />
          </div>
          {expandDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Add Link Here",
                  icon: <FontAwesomeIcon icon={faAdd} />,
                  onClick: () => {
                    toggleLinkModal();
                    setExpandDropdown(false);
                  },
                },
                {
                  name: "Edit Collection",
                  icon: <FontAwesomeIcon icon={faPenToSquare} />,
                },
                {
                  name: "Delete Collection",
                  icon: <FontAwesomeIcon icon={faTrashCan} />,
                },
              ]}
              onClickOutside={(e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.id !== "edit-dropdown") setExpandDropdown(false);
              }}
              className="absolute top-7 left-0 z-10 w-44"
            />
          ) : null}

          {linkModal ? (
            <Modal toggleModal={toggleLinkModal}>
              <AddLink toggleLinkModal={toggleLinkModal} />
            </Modal>
          ) : null}
        </div>
      </div>
      {linksByCollection.map((e, i) => {
        return <LinkList key={i} link={e} count={i} />;
      })}
    </div>
  );
}
