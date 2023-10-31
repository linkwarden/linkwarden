import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPen,
  faBoxesStacked,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useModalStore from "@/store/modals";
import useLinkStore from "@/store/links";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useSession } from "next-auth/react";
import useCollectionStore from "@/store/collections";

type Props = {
  className?: string;
  onClick?: Function;
};

export default function SettingsSidebar({ className, onClick }: Props) {
  const session = useSession();
  const userId = session.data?.user.id;

  const { setModal } = useModalStore();

  const { links, removeLink } = useLinkStore();
  const { collections } = useCollectionStore();

  const [linkCollection, setLinkCollection] =
    useState<CollectionIncludingMembersAndLinkCount>();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>();

  const router = useRouter();

  useEffect(() => {
    if (links) setLink(links.find((e) => e.id === Number(router.query.id)));
  }, [links]);

  useEffect(() => {
    if (link)
      setLinkCollection(collections.find((e) => e.id === link?.collection.id));
  }, [link]);

  return (
    <div
      className={`dark:bg-neutral-900 bg-white h-full lg:w-10 w-62 overflow-y-auto lg:p-0 p-5 border-solid border-white border dark:border-neutral-900 dark:lg:border-r-neutral-900 lg:border-r-white border-r-sky-100 dark:border-r-neutral-700 z-20 flex flex-col gap-5 lg:justify-center justify-start ${
        className || ""
      }`}
    >
      <div className="flex flex-col gap-5">
        {link?.collection.ownerId === userId ||
        linkCollection?.members.some(
          (e) => e.userId === userId && e.canUpdate
        ) ? (
          <div
            title="Edit"
            onClick={() => {
              link
                ? setModal({
                    modal: "LINK",
                    state: true,
                    active: link,
                    method: "UPDATE",
                  })
                : undefined;
              onClick && onClick();
            }}
            className={`hover:opacity-60 duration-100 py-2 px-2 cursor-pointer flex items-center gap-4 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faPen}
              className="w-6 h-6 text-gray-500 dark:text-gray-300"
            />

            <p className="text-black dark:text-white truncate w-full lg:hidden">
              Edit
            </p>
          </div>
        ) : undefined}

        <div
          onClick={() => {
            link
              ? setModal({
                  modal: "LINK",
                  state: true,
                  active: link,
                  method: "FORMATS",
                })
              : undefined;
            onClick && onClick();
          }}
          title="Preserved Formats"
          className={`hover:opacity-60 duration-100 py-2 px-2 cursor-pointer flex items-center gap-4 w-full rounded-md h-8`}
        >
          <FontAwesomeIcon
            icon={faBoxesStacked}
            className="w-6 h-6 text-gray-500 dark:text-gray-300"
          />

          <p className="text-black dark:text-white truncate w-full lg:hidden">
            Preserved Formats
          </p>
        </div>

        {link?.collection.ownerId === userId ||
        linkCollection?.members.some(
          (e) => e.userId === userId && e.canDelete
        ) ? (
          <div
            onClick={() => {
              if (link?.id) {
                removeLink(link.id);
                router.back();
                onClick && onClick();
              }
            }}
            title="Delete"
            className={`hover:opacity-60 duration-100 py-2 px-2 cursor-pointer flex items-center gap-4 w-full rounded-md h-8`}
          >
            <FontAwesomeIcon
              icon={faTrashCan}
              className="w-6 h-6 text-gray-500 dark:text-gray-300"
            />

            <p className="text-black dark:text-white truncate w-full lg:hidden">
              Delete
            </p>
          </div>
        ) : undefined}
      </div>
    </div>
  );
}
