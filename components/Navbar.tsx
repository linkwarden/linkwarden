import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import useCollectionSlice from "@/store/collection";
import { Collection } from "@prisma/client";
import ClickAwayHandler from "./ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import AddLinkModal from "./AddLinkModal";

export default function () {
  const router = useRouter();
  const collectionId = router.query.id;

  const { collections } = useCollectionSlice();

  const activeCollection: Collection | undefined = collections.find(
    (e) => e.id.toString() == collectionId
  );

  const [collectionInput, setCollectionInput] = useState(false);

  const toggleCollectionInput = () => {
    setCollectionInput(!collectionInput);
  };

  return (
    <div className="flex justify-between items-center p-5 border-solid border-b-sky-100 border border-l-white">
      <p>{activeCollection?.name}</p>
      <div className="flex items-center gap-3">
        <FontAwesomeIcon
          icon={faPlus}
          onClick={toggleCollectionInput}
          className="select-none cursor-pointer w-5 h-5 text-white bg-sky-500 p-2 rounded hover:bg-sky-400 duration-100"
        />
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="select-none cursor-pointer w-5 h-5 text-white bg-sky-500 p-2 rounded hover:bg-sky-400 duration-100"
        />
        <div
          onClick={() => signOut()}
          className="cursor-pointer w-max text-sky-900"
        >
          Sign Out
        </div>

        {collectionInput ? (
          <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center">
            <ClickAwayHandler
              onClickOutside={toggleCollectionInput}
              className="w-fit mx-auto"
            >
              <AddLinkModal />
            </ClickAwayHandler>
          </div>
        ) : null}
      </div>
    </div>
  );
}
