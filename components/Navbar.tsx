import { useRouter } from "next/router";
import useCollectionStore from "@/store/collections";
import { Collection, Tag } from "@prisma/client";
import ClickAwayHandler from "./ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFolder,
  faBox,
  faHashtag,
  faBookmark,
  faMagnifyingGlass,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import AddLinkModal from "./AddLinkModal";
import useTagStore from "@/store/tags";

export default function () {
  const router = useRouter();
  const [pageName, setPageName] = useState<string | null>("");
  const [pageIcon, setPageIcon] = useState<IconDefinition | null>(null);

  const { collections } = useCollectionStore();
  const { tags } = useTagStore();

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

      setPageIcon(faHashtag);
    } else if (router.route === "/collections") {
      setPageName("All Collections");
      setPageIcon(faBox);
    } else if (router.route === "/links") {
      setPageName("All Links");
      setPageIcon(faBookmark);
    }
  }, [router, collections, tags]);

  const [linkModal, setLinkModal] = useState(false);

  const toggleLinkModal = () => {
    setLinkModal(!linkModal);
  };

  return (
    <div className="flex justify-between items-center p-2 border-solid border-b-sky-100 border-b">
      <div className="text-sky-900 rounded-md my-1 flex items-center gap-2 font-bold">
        {pageIcon ? (
          <FontAwesomeIcon icon={pageIcon} className="w-4 text-sky-300" />
        ) : null}
        <p>{pageName}</p>
      </div>

      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center relative">
          <label
            htmlFor="search-box"
            className="inline-flex w-fit absolute right-0  cursor-pointer"
            title="Search"
          >
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="select-none w-5 h-5 rounded-md p-1 text-sky-500 "
            />
          </label>
          <input
            id="search-box"
            type="text"
            placeholder="Search for Links"
            className="border border-sky-100 rounded-md pr-6 w-6 focus:border-sky-500 focus:w-60 hover:border-sky-500 duration-100 outline-none p-1 text-sm"
          />
        </div>
        <FontAwesomeIcon
          icon={faPlus}
          onClick={toggleLinkModal}
          title="New Link"
          className="select-none cursor-pointer w-5 h-5 text-sky-500 p-1 rounded-md hover:outline-sky-500 outline duration-100 hover:bg-white outline-sky-100 outline-1"
        />

        {linkModal ? (
          <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 flex items-center fade-in z-10">
            <ClickAwayHandler
              onClickOutside={toggleLinkModal}
              className="w-fit mx-auto"
            >
              <AddLinkModal toggleLinkModal={toggleLinkModal} />
            </ClickAwayHandler>
          </div>
        ) : null}
      </div>
    </div>
  );
}
