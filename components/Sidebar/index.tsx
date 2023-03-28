import ClickAwayHandler from "@/components/ClickAwayHandler";
import { useState } from "react";
import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolder,
  faBox,
  faHashtag,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons";
import SidebarItem from "./SidebarItem";
import useTagStore from "@/store/tags";
import Link from "next/link";

export default function () {
  const [collectionInput, setCollectionInput] = useState(false);

  const { collections, addCollection } = useCollectionStore();

  const { tags } = useTagStore();

  const toggleCollectionInput = () => {
    setCollectionInput(!collectionInput);
  };

  const submitCollection = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const collectionName: string = (event.target as HTMLInputElement).value;

    if (event.key === "Enter" && collectionName) {
      addCollection(collectionName);
      (event.target as HTMLInputElement).value = "";
    }
  };

  return (
    <div className="fixed bg-gray-100 top-0 bottom-0 left-0 w-80 p-2 overflow-y-auto hide-scrollbar border-solid border-r-sky-100 border z-20">
      <p className="p-2 text-sky-500 font-bold text-xl mb-5 leading-4">
        Linkwarden
      </p>

      <Link href="/links">
        <div className="hover:bg-gray-50 hover:outline outline-sky-100 outline-1 duration-100 text-sky-900 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2">
          <FontAwesomeIcon icon={faBookmark} className="w-4 text-sky-300" />
          <p>All Links</p>
        </div>
      </Link>

      <Link href="/collections">
        <div className="hover:bg-gray-50 hover:outline outline-sky-100 outline-1 duration-100 text-sky-900 rounded-md my-1 p-2 cursor-pointer flex items-center gap-2">
          <FontAwesomeIcon icon={faBox} className="w-4 text-sky-300" />
          <p>All Collections</p>
        </div>
      </Link>

      <div className="text-gray-500 flex items-center justify-between mt-5">
        <p className="text-sm p-2">Collections</p>
        {collectionInput ? (
          <ClickAwayHandler
            onClickOutside={toggleCollectionInput}
            className="w-fit"
          >
            <input
              type="text"
              placeholder="Enter Collection Name"
              className="w-44 rounded-md p-1 border-sky-500 border-solid border text-sm outline-none"
              onKeyDown={submitCollection}
              autoFocus
            />
          </ClickAwayHandler>
        ) : (
          <div
            title="Add Collection"
            onClick={toggleCollectionInput}
            className="select-none text-gray-500 rounded-md cursor-pointer hover:bg-white hover:outline outline-sky-100 outline-1 duration-100 p-1"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          </div>
        )}
      </div>
      <div>
        {collections.map((e, i) => {
          return (
            <SidebarItem
              key={i}
              text={e.name}
              icon={<FontAwesomeIcon icon={faFolder} />}
              path={`/collections/${e.id}`}
            />
          );
        })}
      </div>
      <div className="text-gray-500 flex items-center justify-between mt-5">
        <p className="text-sm p-2">Tags</p>
      </div>
      <div>
        {tags.map((e, i) => {
          return (
            <SidebarItem
              key={i}
              text={e.name}
              icon={<FontAwesomeIcon icon={faHashtag} />}
              path={`/tags/${e.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}
