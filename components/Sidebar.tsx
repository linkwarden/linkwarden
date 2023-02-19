import { useSession } from "next-auth/react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { useState } from "react";
import useCollectionSlice from "@/store/collection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faUserCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faDatabase,
  faPlus,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

export default function Sidebar() {
  const { data: session } = useSession();

  const [collectionInput, setCollectionInput] = useState(false);

  const { collections, addCollection } = useCollectionSlice();

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
      <div className="flex gap-3 items-center mb-5 cursor-pointer w-fit text-gray-600">
        <FontAwesomeIcon icon={faUserCircle} className="h-8" />
        <div className="flex items-center gap-1">
          <p>{user?.name}</p>
          <FontAwesomeIcon icon={faChevronDown} className="h-3" />
        </div>
      </div>

      <div className="hover:bg-sky-100 hover:shadow-sm duration-100 text-sky-900 rounded my-1 p-3 cursor-pointer flex items-center gap-2">
        <FontAwesomeIcon icon={faDatabase} className="w-4" />
        <p>All Collections</p>
      </div>

      <div className="text-gray-500 flex items-center justify-between mt-5">
        <p>Collections</p>
        {collectionInput ? (
          <ClickAwayHandler
            onClickOutside={toggleCollectionInput}
            className="w-fit"
          >
            <input
              type="text"
              placeholder="Enter Collection Name"
              className="w-44 rounded p-1"
              onKeyDown={submitCollection}
              autoFocus
            />
          </ClickAwayHandler>
        ) : (
          <FontAwesomeIcon
            icon={faPlus}
            onClick={toggleCollectionInput}
            className="select-none cursor-pointer rounded p-2 w-3"
          />
        )}
      </div>
      <div>
        {collections.map((e, i) => {
          return (
            <div
              className="hover:bg-sky-100 hover:shadow-sm duration-100 text-sky-900 rounded my-1 p-3 cursor-pointer flex items-center gap-2"
              key={i}
            >
              <FontAwesomeIcon icon={faFolder} className="w-4" />
              <p>{e.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
