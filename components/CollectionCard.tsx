import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { CollectionIncludingMembers } from "@/types/global";
import useLinkStore from "@/store/links";
import Dropdown from "./Dropdown";
import { useState } from "react";
import Modal from "@/components/Modal";
import CollectionModal from "@/components/Modal/Collection";
import ProfilePhoto from "./ProfilePhoto";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";

type Props = {
  collection: CollectionIncludingMembers;
  className?: string;
};

export default function CollectionCard({ collection, className }: Props) {
  const { links } = useLinkStore();
  const formattedDate = new Date(collection.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const [expandDropdown, setExpandDropdown] = useState(false);
  const [editCollectionModal, setEditCollectionModal] = useState(false);
  const [collectionMembersModal, setCollectionMembersModal] = useState(false);
  const [deleteCollectionModal, setDeleteCollectionModal] = useState(false);

  const toggleEditCollectionModal = () => {
    setEditCollectionModal(!editCollectionModal);
  };

  const toggleCollectionMembersModal = () => {
    setCollectionMembersModal(!collectionMembersModal);
  };

  const toggleDeleteCollectionModal = () => {
    setDeleteCollectionModal(!deleteCollectionModal);
  };

  return (
    <div
      className={`bg-gradient-to-tr from-sky-100 from-10% via-gray-100 via-20% to-white to-100% self-stretch min-h-[12rem] rounded-2xl shadow duration-100 hover:shadow-none group relative ${className}`}
    >
      <div
        onClick={() => setExpandDropdown(!expandDropdown)}
        id={"expand-dropdown" + collection.id}
        className="inline-flex absolute top-5 right-5 rounded-md cursor-pointer hover:bg-slate-200 duration-100 p-1"
      >
        <FontAwesomeIcon
          icon={faEllipsis}
          id={"expand-dropdown" + collection.id}
          className="w-5 h-5 text-gray-500"
        />
      </div>
      <Link
        href={`/collections/${collection.id}`}
        className="flex flex-col gap-2 justify-between min-h-[12rem] h-full select-none p-5"
      >
        <p className="text-2xl font-bold capitalize text-sky-500 break-words line-clamp-3 w-4/5">
          {collection.name}
        </p>
        <div className="flex justify-between items-center">
          <div className="text-sky-400 flex items-center w-full">
            {collection.members
              .sort((a, b) => (a.userId as number) - (b.userId as number))
              .map((e, i) => {
                return (
                  <ProfilePhoto
                    key={i}
                    src={`/api/avatar/${e.userId}`}
                    className="-mr-3"
                  />
                );
              })
              .slice(0, 4)}
            {collection.members.length - 4 > 0 ? (
              <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-500 border-sky-100 -mr-3">
                +{collection.members.length - 4}
              </div>
            ) : null}
          </div>
          <div className="text-right w-40">
            <div className="text-sky-500 font-bold text-sm flex justify-end gap-1 items-center">
              <FontAwesomeIcon icon={faLink} className="w-5 h-5 text-sky-600" />
              {links.filter((e) => e.collectionId === collection.id).length}
            </div>
            <div className="flex items-center justify-end gap-1 text-gray-600">
              <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
              <p className="font-bold text-xs">{formattedDate}</p>
            </div>
          </div>
        </div>
      </Link>
      {expandDropdown ? (
        <Dropdown
          items={[
            {
              name: "Edit Collection",
              onClick: () => {
                toggleEditCollectionModal();
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
            if (target.id !== "expand-dropdown" + collection.id)
              setExpandDropdown(false);
          }}
          className="absolute top-[3.2rem] right-5 z-10 w-36"
        />
      ) : null}
      {editCollectionModal ? (
        <Modal toggleModal={toggleEditCollectionModal}>
          <CollectionModal
            toggleCollectionModal={toggleEditCollectionModal}
            activeCollection={collection}
            method="UPDATE"
          />
        </Modal>
      ) : null}
      {collectionMembersModal ? (
        <Modal toggleModal={toggleCollectionMembersModal}>
          <CollectionModal
            defaultIndex={1}
            toggleCollectionModal={toggleCollectionMembersModal}
            activeCollection={collection}
            method="UPDATE"
          />
        </Modal>
      ) : null}
      {deleteCollectionModal ? (
        <Modal toggleModal={toggleDeleteCollectionModal}>
          <CollectionModal
            defaultIndex={2}
            activeCollection={collection}
            toggleCollectionModal={toggleDeleteCollectionModal}
            method="UPDATE"
          />
        </Modal>
      ) : null}
    </div>
  );
}
