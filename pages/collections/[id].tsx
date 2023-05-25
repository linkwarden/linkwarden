// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

import Dropdown from "@/components/Dropdown";
import LinkList from "@/components/LinkList";
import Modal from "@/components/Modal";
import AddLink from "@/components/Modal/AddLink";
import EditCollection from "@/components/Modal/EditCollection";
import DeleteCollection from "@/components/Modal/DeleteCollection";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { ExtendedCollection } from "@/types/global";
import {
  faAdd,
  faEllipsis,
  faFolder,
  faPenToSquare,
  faSort,
  faTrashCan,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import RadioButton from "@/components/RadioButton";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import ImageWithFallback from "@/components/ImageWithFallback";

export default function () {
  const router = useRouter();

  const { links } = useLinkStore();
  const { collections } = useCollectionStore();

  const [expandDropdown, setExpandDropdown] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const [activeCollection, setActiveCollection] =
    useState<ExtendedCollection>();

  const [sortedLinks, setSortedLinks] = useState(links);

  const toggleLinkModal = () => {
    setLinkModal(!linkModal);
  };

  const toggleEditCollectionModal = () => {
    setEditCollectionModal(!editCollectionModal);
  };

  const toggleDeleteCollectionModal = () => {
    setDeleteCollectionModal(!deleteCollectionModal);
  };

  const handleSortChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSortBy(event.target.value);
  };

  useEffect(() => {
    setActiveCollection(
      collections.find((e) => e.id === Number(router.query.id))
    );

    // Sorting logic

    const linksArray = [
      ...links.filter((e) => e.collection.id === Number(router.query.id)),
    ];

    if (sortBy === "Name (A-Z)")
      setSortedLinks(linksArray.sort((a, b) => a.name.localeCompare(b.name)));
    else if (sortBy === "Title (A-Z)")
      setSortedLinks(linksArray.sort((a, b) => a.title.localeCompare(b.title)));
    else if (sortBy === "Name (Z-A)")
      setSortedLinks(linksArray.sort((a, b) => b.name.localeCompare(a.name)));
    else if (sortBy === "Title (Z-A)")
      setSortedLinks(linksArray.sort((a, b) => b.title.localeCompare(a.title)));
    else if (sortBy === "Date (Newest First)")
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    else if (sortBy === "Date (Oldest First)")
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
  }, [links, router, collections, sortBy]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="bg-gradient-to-tr from-sky-100 from-10% via-gray-100 via-20% rounded shadow min-h-[10rem] p-5 flex gap-5 flex-col justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-3 items-center">
              <div className="flex gap-2">
                <FontAwesomeIcon
                  icon={faFolder}
                  className="sm:w-8 sm:h-8 w-6 h-6 mt-2 text-sky-300"
                />
                <p className="sm:text-4xl text-3xl text-sky-900 capitalize">
                  {activeCollection?.name}
                </p>
              </div>
            </div>

            <div>
              <div className="text-sky-400 flex justify-end items-center w-56 mr-3">
                <div className="mr-1 bg-sky-500 p-1 leading-3 select-none cursor-pointer hover:bg-sky-400 duration-100 text-white rounded-full text-xs">
                  View Team
                </div>
                {activeCollection?.members
                  .sort((a, b) => a.userId - b.userId)
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
                {activeCollection?.members.length &&
                activeCollection.members.length - 4 > 0 ? (
                  <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-500 border-sky-100 -mr-3">
                    +{activeCollection?.members?.length - 3}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-gray-500 flex justify-between items-end gap-5">
            <p>{activeCollection?.description}</p>
            <div className="flex items-center gap-2">
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
                        label="Title (A-Z)"
                        state={sortBy === "Title (A-Z)"}
                        onClick={handleSortChange}
                      />

                      <RadioButton
                        label="Title (Z-A)"
                        state={sortBy === "Title (Z-A)"}
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
              <div className="relative">
                <div
                  onClick={() => setExpandDropdown(!expandDropdown)}
                  id="edit-dropdown"
                  className="inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
                >
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    id="edit-dropdown"
                    title="More"
                    className="w-5 h-5 text-gray-500"
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
                      if (target.id !== "edit-dropdown")
                        setExpandDropdown(false);
                    }}
                    className="absolute top-8 right-0 z-10 w-44"
                  />
                ) : null}

                {linkModal ? (
                  <Modal toggleModal={toggleLinkModal}>
                    <AddLink toggleLinkModal={toggleLinkModal} />
                  </Modal>
                ) : null}

                {editCollectionModal && activeCollection ? (
                  <Modal toggleModal={toggleEditCollectionModal}>
                    <EditCollection
                      toggleCollectionModal={toggleEditCollectionModal}
                      collection={activeCollection}
                    />
                  </Modal>
                ) : null}

                {deleteCollectionModal && activeCollection ? (
                  <Modal toggleModal={toggleDeleteCollectionModal}>
                    <DeleteCollection
                      collection={activeCollection}
                      toggleDeleteCollectionModal={toggleDeleteCollectionModal}
                    />
                  </Modal>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
          {sortedLinks.map((e, i) => {
            return <LinkList key={i} link={e} count={i} />;
          })}
        </div>
      </div>
    </MainLayout>
  );
}
