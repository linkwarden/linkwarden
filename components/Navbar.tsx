import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import useCollectionSlice from "@/store/collections";
import { Collection, Tag } from "@prisma/client";
import ClickAwayHandler from "./ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolder,
  faBox,
  faTag,
  faBookmark,
  faMagnifyingGlass,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import AddLinkModal from "./AddLinkModal";
import useTagSlice from "@/store/tags";

export default function () {
  const router = useRouter();
  const [pageName, setPageName] = useState<string | null>("");
  const [pageIcon, setPageIcon] = useState<IconDefinition | null>(null);

  const { collections } = useCollectionSlice();
  const { tags } = useTagSlice();

  useEffect(() => {
    if (router.route === "/collections/[id]") {
      const collectionId = router.query.id;

      const activeCollection: Collection | undefined = collections.find(
        (e) => e.id.toString() == collectionId
      );

      if (activeCollection) {
        setPageName(activeCollection?.name);
      }

      setPageIcon(faFolder);
    } else if (router.route === "/tags/[id]") {
      const tagId = router.query.id;

      const activeTag: Tag | undefined = tags.find(
        (e) => e.id.toString() == tagId
      );

      if (activeTag) {
        setPageName(activeTag?.name);
      }

      setPageIcon(faTag);
    } else if (router.route === "/collections") {
      setPageName("All Collections");
      setPageIcon(faBox);
    } else if (router.route === "/links") {
      setPageName("All Links");
      setPageIcon(faBookmark);
    }
  }, [router, collections, tags]);

  const [collectionInput, setCollectionInput] = useState(false);

  const toggleCollectionInput = () => {
    setCollectionInput(!collectionInput);
  };

  return (
    <div className="flex justify-between items-center p-5 border-solid border-b-sky-100 border border-l-white">
      <div className="text-sky-900 rounded my-1 flex items-center gap-2 font-bold">
        {pageIcon ? (
          <FontAwesomeIcon icon={pageIcon} className="w-4 text-sky-300" />
        ) : null}
        <p>{pageName}</p>
      </div>
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
          <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center fade-in">
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
