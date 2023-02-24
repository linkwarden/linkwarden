import { useSession } from "next-auth/react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { useState } from "react";
import useCollectionSlice from "@/store/collection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faPlus,
  faChevronDown,
  faFolder,
  faHouse,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import SidebarItem from "./SidebarItem";
import useTagSlice from "@/store/tags";

export default function () {
  const { data: session } = useSession();

  const [collectionInput, setCollectionInput] = useState(false);

  const { collections, addCollection } = useCollectionSlice();

  const { tags } = useTagSlice();

  const user = session?.user;

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
    <div className="fixed bg-gray-100 top-0 bottom-0 left-0 w-80 p-5 overflow-y-auto hide-scrollbar border-solid border-r-sky-100 border">
      <div className="flex gap-3 items-center mb-5 p-3 cursor-pointer w-fit text-gray-600">
        <FontAwesomeIcon icon={faUserCircle} className="h-8" />
        <div className="flex items-center gap-1">
          <p>{user?.name}</p>
          <FontAwesomeIcon icon={faChevronDown} className="h-3" />
        </div>
      </div>

      <SidebarItem item={{ name: "All Collections" }} icon={faHouse} />

      <div className="text-gray-500 flex items-center justify-between mt-5">
        <p className="text-sm p-3">Collections</p>
        {collectionInput ? (
          <ClickAwayHandler
            onClickOutside={toggleCollectionInput}
            className="w-fit"
          >
            <input
              type="text"
              placeholder="Enter Collection Name"
              className="w-44 rounded p-2 border-sky-100 border-solid border text-sm outline-none"
              onKeyDown={submitCollection}
              autoFocus
            />
          </ClickAwayHandler>
        ) : (
          <FontAwesomeIcon
            icon={faPlus}
            onClick={toggleCollectionInput}
            className="select-none cursor-pointer p-2 w-3"
          />
        )}
      </div>
      <div>
        {collections.map((e, i) => {
          return <SidebarItem key={i} item={e} icon={faFolder} />;
        })}
      </div>
      <div className="text-gray-500 flex items-center justify-between mt-5">
        <p className="text-sm p-3">Tags</p>
      </div>
      <div>
        {tags.map((e, i) => {
          return <SidebarItem key={i} item={e} icon={faHashtag} />;
        })}
      </div>
    </div>
  );
}
