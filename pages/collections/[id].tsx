import Dropdown from "@/components/Dropdown";
import LinkList from "@/components/LinkList";
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

  const [editDropdown, setEditDropdown] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection>();
  const [linksByCollection, setLinksByCollection] =
    useState<ExtendedLink[]>(links);

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
            onClick={() => setEditDropdown(!editDropdown)}
            id="edit-dropdown"
            className="inline-flex rounded-md cursor-pointer hover:bg-white hover:border-sky-500 border-sky-100 border duration-100 p-1"
          >
            <FontAwesomeIcon
              icon={faEllipsis}
              id="edit-dropdown"
              className="w-4 h-4 text-gray-500"
            />
          </div>
          {editDropdown ? (
            <Dropdown
              items={[
                {
                  name: "Add Link Here",
                  icon: <FontAwesomeIcon icon={faAdd} />,
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
                if (target.id !== "edit-dropdown") setEditDropdown(false);
              }}
              className="absolute top-7 left-0 z-10 w-44"
            />
          ) : null}
        </div>
      </div>
      {linksByCollection.map((e, i) => {
        return <LinkList key={i} link={e} count={i} />;
      })}
    </div>
  );
}
