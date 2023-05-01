// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import useCollectionStore from "@/store/collections";
import {
  faAdd,
  faBox,
  faEllipsis,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CollectionCard from "@/components/CollectionCard";
import Dropdown from "@/components/Dropdown";
import { useState } from "react";
import Modal from "@/components/Modal";
import AddCollection from "@/components/Modal/AddCollection";
import Dashboard from "@/layouts/Dashboard";

export default function () {
  const { collections } = useCollectionStore();
  const [expandDropdown, setExpandDropdown] = useState(false);

  const [linkModal, setLinkModal] = useState(false);

  const toggleCollectionModal = () => {
    setLinkModal(!linkModal);
  };

  return (
    // ml-80
    <Dashboard>
      <div className="p-5">
        <div className="flex gap-3 items-center mb-5">
          <div className="flex gap-2 items-center">
            <FontAwesomeIcon icon={faBox} className="w-5 h-5 text-sky-300" />
            <p className="text-lg text-sky-900">All Collections</p>
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
                className="w-5 h-5 text-gray-500"
              />
            </div>
            {expandDropdown ? (
              <Dropdown
                items={[
                  {
                    name: "New",
                    icon: <FontAwesomeIcon icon={faAdd} />,
                    onClick: () => {
                      toggleCollectionModal();
                      setExpandDropdown(false);
                    },
                  },
                ]}
                onClickOutside={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (target.id !== "edit-dropdown") setExpandDropdown(false);
                }}
                className="absolute top-8 left-0 w-36"
              />
            ) : null}
          </div>

          {linkModal ? (
            <Modal toggleModal={toggleCollectionModal}>
              <AddCollection toggleCollectionModal={toggleCollectionModal} />
            </Modal>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-5">
          {collections.map((e, i) => {
            return <CollectionCard key={i} collection={e} />;
          })}

          <div
            className="p-5 bg-gray-100 h-40 w-60 rounded-md border-sky-100 border-solid border flex flex-col gap-4 justify-center items-center cursor-pointer hover:bg-gray-50 duration-100"
            onClick={toggleCollectionModal}
          >
            <p className="text-sky-900">New Collection</p>
            <FontAwesomeIcon icon={faPlus} className="w-8 h-8 text-sky-500" />
          </div>
        </div>
      </div>
    </Dashboard>
  );
}
