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
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CollectionCard from "@/components/CollectionCard";
import Dropdown from "@/components/Dropdown";
import { ChangeEvent, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import AddCollection from "@/components/Modal/AddCollection";
import MainLayout from "@/layouts/MainLayout";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import RadioButton from "@/components/RadioButton";

export default function () {
  const { collections } = useCollectionStore();
  const [expandDropdown, setExpandDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name (A-Z)");
  const [sortedCollections, setSortedCollections] = useState(collections);

  const [collectionModal, setCollectionModal] = useState(false);

  const toggleCollectionModal = () => {
    setCollectionModal(!collectionModal);
  };

  const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortBy(event.target.value);
  };

  useEffect(() => {
    const collectionsArray = [...collections];

    if (sortBy === "Name (A-Z)")
      setSortedCollections(
        collectionsArray.sort((a, b) => a.name.localeCompare(b.name))
      );
    else if (sortBy === "Description (A-Z)")
      setSortedCollections(
        collectionsArray.sort((a, b) =>
          a.description.localeCompare(b.description)
        )
      );
    else if (sortBy === "Name (Z-A)")
      setSortedCollections(
        collectionsArray.sort((a, b) => b.name.localeCompare(a.name))
      );
    else if (sortBy === "Description (Z-A)")
      setSortedCollections(
        collectionsArray.sort((a, b) =>
          b.description.localeCompare(a.description)
        )
      );
    else if (sortBy === "Date (Newest First)")
      setSortedCollections(
        collectionsArray.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    else if (sortBy === "Date (Oldest First)")
      setSortedCollections(
        collectionsArray.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
  }, [collections, sortBy]);

  return (
    // ml-80
    <MainLayout>
      <div className="p-5">
        <div className="flex gap-3 items-center justify-between mb-5">
          <div className="flex gap-3 items-center">
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
          </div>

          <div className="relative">
            <div
              onClick={() => setSortDropdown(!sortDropdown)}
              id="sort-dropdown"
              className="inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
            >
              <FontAwesomeIcon
                icon={faSort}
                id="sort-dropdown"
                className="w-5 h-5 text-gray-500"
              />
            </div>

            {sortDropdown ? (
              <ClickAwayHandler
                onClickOutside={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (target.id !== "sort-dropdown") setSortDropdown(false);
                }}
                className="absolute top-8 right-0 shadow-md bg-gray-50 rounded-md p-2 z-10 border border-sky-100 w-48"
              >
                <p className="mb-2 text-sky-900 text-center font-semibold">
                  Sort by
                </p>
                <div className="flex flex-col gap-2">
                  <RadioButton
                    label="Name (A-Z)"
                    state={sortBy === "Name (A-Z)"}
                    onClick={handleSortChange}
                  />

                  <RadioButton
                    label="Name (Z-A)"
                    state={sortBy === "Name (Z-A)"}
                    onClick={handleSortChange}
                  />

                  <RadioButton
                    label="Description (A-Z)"
                    state={sortBy === "Description (A-Z)"}
                    onClick={handleSortChange}
                  />

                  <RadioButton
                    label="Description (Z-A)"
                    state={sortBy === "Description (Z-A)"}
                    onClick={handleSortChange}
                  />

                  <RadioButton
                    label="Date (Newest First)"
                    state={sortBy === "Date (Newest First)"}
                    onClick={handleSortChange}
                  />

                  <RadioButton
                    label="Date (Oldest First)"
                    state={sortBy === "Date (Oldest First)"}
                    onClick={handleSortChange}
                  />
                </div>
              </ClickAwayHandler>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          {sortedCollections.map((e, i) => {
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

      {collectionModal ? (
        <Modal toggleModal={toggleCollectionModal}>
          <AddCollection toggleCollectionModal={toggleCollectionModal} />
        </Modal>
      ) : null}
    </MainLayout>
  );
}
