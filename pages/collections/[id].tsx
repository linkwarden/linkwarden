import Dropdown from "@/components/Dropdown";
import LinkCard from "@/components/LinkCard";
import Modal from "@/components/Modal";
import LinkModal from "@/components/Modal/LinkModal";
import CollectionModal from "@/components/Modal/Collection";
import useCollectionStore from "@/store/collections";
import useLinkStore from "@/store/links";
import { CollectionIncludingMembers } from "@/types/global";
import {
  faEllipsis,
  faFolder,
  faSort,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import MainLayout from "@/layouts/MainLayout";
import { useSession } from "next-auth/react";
import ProfilePhoto from "@/components/ProfilePhoto";
import SortLinkDropdown from "@/components/SortLinkDropdown";

export default function Index() {
  const router = useRouter();

  const { links } = useLinkStore();
  const { collections } = useCollectionStore();

  const { data } = useSession();

  const [expandDropdown, setExpandDropdown] = useState(false);
  const [linkModal, setLinkModal] = useState(false);
  const [collectionInfoModal, setCollectionInfoModal] = useState(false);
  const [collectionMembersModal, setCollectionMembersModal] = useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("Name (A-Z)");

  const [activeCollection, setActiveCollection] =
    useState<CollectionIncludingMembers>();

  const [sortedLinks, setSortedLinks] = useState(links);

  const toggleLinkModal = () => {
    setLinkModal(!linkModal);
  };

  const toggleCollectionInfoModal = () => {
    setCollectionInfoModal(!collectionInfoModal);
  };

  const toggleCollectionMembersModal = () => {
    setCollectionMembersModal(!collectionMembersModal);
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
            new Date(b.createdAt as string).getTime() -
            new Date(a.createdAt as string).getTime()
        )
      );
    else if (sortBy === "Date (Oldest First)")
      setSortedLinks(
        linksArray.sort(
          (a, b) =>
            new Date(a.createdAt as string).getTime() -
            new Date(b.createdAt as string).getTime()
        )
      );
  }, [links, router, collections, sortBy]);

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-5 w-full">
        <div className="bg-gradient-to-tr from-sky-100 from-10% via-gray-100 via-20% rounded-xl shadow min-h-[10rem] p-5 flex gap-5 flex-col justify-between">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center sm:items-start">
            {activeCollection ? (
              <div className="flex gap-3 items-center">
                <div className="flex gap-2">
                  <FontAwesomeIcon
                    icon={faFolder}
                    style={{ color: activeCollection?.color }}
                    className="sm:w-8 sm:h-8 w-6 h-6 mt-2 drop-shadow"
                  />
                  <p className="sm:text-4xl text-3xl capitalize bg-gradient-to-tr from-sky-500 to-slate-400 bg-clip-text text-transparent font-bold">
                    {activeCollection?.name}
                  </p>
                </div>
              </div>
            ) : null}

            {activeCollection ? (
              <div
                className={`text-sky-400 w-60 ${
                  activeCollection.members[0] && "mr-3"
                }`}
              >
                <div
                  onClick={toggleCollectionMembersModal}
                  className="flex justify-center sm:justify-end items-center w-fit mx-auto sm:mr-0 sm:ml-auto group cursor-pointer"
                >
                  <div
                    className={`bg-sky-500 p-2 leading-3 select-none group-hover:bg-sky-400 duration-100 text-white rounded-full text-xs ${
                      activeCollection.members[0] && "mr-1"
                    }`}
                  >
                    {activeCollection.ownerId === data?.user.id
                      ? "Manage"
                      : "View"}{" "}
                    Team
                  </div>
                  {activeCollection?.members
                    .sort((a, b) => (a.userId as number) - (b.userId as number))
                    .map((e, i) => {
                      return (
                        <ProfilePhoto
                          key={i}
                          src={`/api/avatar/${e.userId}`}
                          className="-mr-3 duration-100"
                        />
                      );
                    })
                    .slice(0, 4)}
                  {activeCollection?.members.length &&
                  activeCollection.members.length - 4 > 0 ? (
                    <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-500 border-sky-100 -mr-3">
                      +{activeCollection?.members?.length - 4}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="text-gray-500 flex justify-between items-end gap-5">
            <p>{activeCollection?.description}</p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  onClick={() => setSortDropdown(!sortDropdown)}
                  id="sort-dropdown"
                  className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 duration-100 p-1"
                >
                  <FontAwesomeIcon
                    icon={faSort}
                    id="sort-dropdown"
                    className="w-5 h-5 text-gray-500"
                  />
                </div>

                {sortDropdown ? (
                  <SortLinkDropdown
                    handleSortChange={handleSortChange}
                    sortBy={sortBy}
                    toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
                  />
                ) : null}
              </div>
              <div className="relative">
                <div
                  onClick={() => setExpandDropdown(!expandDropdown)}
                  id="expand-dropdown"
                  className="inline-flex rounded-md cursor-pointer hover:bg-slate-200 duration-100 p-1"
                >
                  <FontAwesomeIcon
                    icon={faEllipsis}
                    id="expand-dropdown"
                    title="More"
                    className="w-5 h-5 text-gray-500"
                  />
                </div>
                {expandDropdown ? (
                  <Dropdown
                    items={[
                      {
                        name: "Add Link Here",
                        onClick: () => {
                          toggleLinkModal();
                          setExpandDropdown(false);
                        },
                      },
                      {
                        name: "Edit Collection Info",
                        onClick: () => {
                          toggleCollectionInfoModal();
                          setExpandDropdown(false);
                        },
                      },
                      {
                        name: "Share/Collaborate",
                        onClick: () => {
                          toggleCollectionMembersModal();
                          setExpandDropdown(false);
                        },
                      },
                      {
                        name: "Delete Collection",
                        onClick: () => {
                          toggleDeleteCollectionModal();
                          setExpandDropdown(false);
                        },
                      },
                    ]}
                    onClickOutside={(e: Event) => {
                      const target = e.target as HTMLInputElement;
                      if (target.id !== "expand-dropdown")
                        setExpandDropdown(false);
                    }}
                    className="absolute top-8 right-0 z-10 w-40"
                  />
                ) : null}

                {linkModal ? (
                  <Modal toggleModal={toggleLinkModal}>
                    <LinkModal
                      toggleLinkModal={toggleLinkModal}
                      method="CREATE"
                    />
                  </Modal>
                ) : null}

                {collectionInfoModal && activeCollection ? (
                  <Modal
                    toggleModal={toggleCollectionInfoModal}
                    className="h-[35rem]"
                  >
                    <CollectionModal
                      toggleCollectionModal={toggleCollectionInfoModal}
                      activeCollection={activeCollection}
                      method="UPDATE"
                    />
                  </Modal>
                ) : null}

                {collectionMembersModal && activeCollection ? (
                  <Modal
                    toggleModal={toggleCollectionMembersModal}
                    className="h-[35rem]"
                  >
                    <CollectionModal
                      defaultIndex={1}
                      toggleCollectionModal={toggleCollectionMembersModal}
                      activeCollection={activeCollection}
                      method="UPDATE"
                    />
                  </Modal>
                ) : null}

                {deleteCollectionModal && activeCollection ? (
                  <Modal
                    toggleModal={toggleDeleteCollectionModal}
                    className="h-[35rem]"
                  >
                    <CollectionModal
                      defaultIndex={2}
                      toggleCollectionModal={toggleDeleteCollectionModal}
                      activeCollection={activeCollection}
                      method="UPDATE"
                    />
                  </Modal>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-5">
          {sortedLinks.map((e, i) => {
            return <LinkCard key={i} link={e} count={i} />;
          })}
        </div>
      </div>
    </MainLayout>
  );
}
