import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis, faLink } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import Dropdown from "./Dropdown";
import { useState } from "react";
import ProfilePhoto from "./ProfilePhoto";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import useModalStore from "@/store/modals";
import usePermissions from "@/hooks/usePermissions";

type Props = {
  collection: CollectionIncludingMembersAndLinkCount;
  className?: string;
};

export default function CollectionCard({ collection, className }: Props) {
  const { setModal } = useModalStore();

  const formattedDate = new Date(collection.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const [expandDropdown, setExpandDropdown] = useState(false);

  const permissions = usePermissions(collection.id as number);

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
                    className="-mr-3 border-[3px]"
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
              {collection._count && collection._count.links}
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
            permissions === true
              ? {
                  name: "Edit Collection Info",
                  onClick: () => {
                    collection &&
                      setModal({
                        modal: "COLLECTION",
                        state: true,
                        method: "UPDATE",
                        isOwner: permissions === true,
                        active: collection,
                      });
                    setExpandDropdown(false);
                  },
                }
              : undefined,
            {
              name: permissions === true ? "Share/Collaborate" : "View Team",
              onClick: () => {
                collection &&
                  setModal({
                    modal: "COLLECTION",
                    state: true,
                    method: "UPDATE",
                    isOwner: permissions === true,
                    active: collection,
                    defaultIndex: permissions === true ? 1 : 0,
                  });
                setExpandDropdown(false);
              },
            },

            {
              name:
                permissions === true ? "Delete Collection" : "Leave Collection",
              onClick: () => {
                collection &&
                  setModal({
                    modal: "COLLECTION",
                    state: true,
                    method: "UPDATE",
                    isOwner: permissions === true,
                    active: collection,
                    defaultIndex: permissions === true ? 2 : 1,
                  });
                setExpandDropdown(false);
              },
            },
          ]}
          onClickOutside={(e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.id !== "expand-dropdown" + collection.id)
              setExpandDropdown(false);
          }}
          className="absolute top-[3.2rem] right-5 z-10"
        />
      ) : null}
    </div>
  );
}
