import {
  CollectionIncludingMembers,
  LinkIncludingCollectionAndTags,
} from "@/types/global";
import {
  faFolder,
  faArrowUpRightFromSquare,
  faEllipsis,
} from "@fortawesome/free-solid-svg-icons";
import { faFileImage, faFilePdf } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import Image from "next/image";
import Dropdown from "./Dropdown";
import useLinkStore from "@/store/links";
import Link from "next/link";
import useCollectionStore from "@/store/collections";
import useModalStore from "@/store/modals";

type Props = {
  link: LinkIncludingCollectionAndTags;
  count: number;
  className?: string;
};

export default function LinkCard({ link, count, className }: Props) {
  const { setModal } = useModalStore();

  const [expandDropdown, setExpandDropdown] = useState(false);

  const { collections } = useCollectionStore();

  const [collection, setCollection] = useState<CollectionIncludingMembers>(
    collections.find(
      (e) => e.id === link.collection.id
    ) as CollectionIncludingMembers
  );

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembers
    );
  }, [collections]);

  const { removeLink } = useLinkStore();

  const url = new URL(link.url);
  const formattedDate = new Date(link.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <div
      className={`bg-gradient-to-tr from-slate-200 from-10% to-gray-50 via-20% shadow-sm p-5 rounded-2xl relative group/item ${className}`}
    >
      <div className="flex items-start gap-5 sm:gap-10 h-full w-full">
        <Image
          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
          width={42}
          height={42}
          alt=""
          className="select-none mt-3 z-10 rounded-full shadow border-[3px] border-white bg-white"
          draggable="false"
          onError={(e) => {
            const target = e.target as HTMLElement;
            target.style.opacity = "0";
          }}
        />
        <Image
          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
          width={80}
          height={80}
          alt=""
          className="blur-sm absolute left-2 opacity-40 select-none hidden sm:block"
          draggable="false"
          onError={(e) => {
            const target = e.target as HTMLElement;
            target.style.opacity = "0";
          }}
        />
        <div className="flex justify-between gap-5 w-full h-full z-0">
          <div className="flex flex-col justify-between w-full">
            <div className="flex items-baseline gap-1">
              <p className="text-sm text-sky-400 font-bold">{count + 1}.</p>
              <p className="text-lg text-sky-500 font-bold truncate max-w-[12rem]">
                {link.name}
              </p>
            </div>
            <p className="text-gray-500 text-sm font-medium line-clamp-3 w-4/5">
              {link.title}
            </p>
            <div className="flex gap-3 items-center flex-wrap my-3">
              <Link href={`/collections/${link.collection.id}`}>
                <div className="flex items-center gap-1 cursor-pointer hover:opacity-60 duration-100">
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="w-4 h-4 mt-1 drop-shadow"
                    style={{ color: collection?.color }}
                  />
                  <p className="text-sky-900 truncate max-w-[10rem]">
                    {collection?.name}
                  </p>
                </div>
              </Link>

              <div className="flex gap-1 items-center flex-wrap mt-1">
                {link.tags.map((e, i) => (
                  <Link key={i} href={`/tags/${e.id}`}>
                    <p className="px-2 py-1 bg-sky-200 text-sky-700 text-xs rounded-3xl cursor-pointer hover:opacity-60 duration-100 truncate max-w-[10rem]">
                      {e.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <p className="text-gray-500">{formattedDate}</p>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="group/url"
              >
                <div className="text-sky-400 font-bold flex items-center gap-1">
                  <p className="truncate w-40">{url.host}</p>
                  <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    className="w-3 opacity-0 group-hover/url:opacity-100 duration-75"
                  />
                </div>
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between items-end relative">
            <div
              onClick={() => setExpandDropdown(!expandDropdown)}
              id={"expand-dropdown" + link.id}
              className="text-gray-500 inline-flex rounded-md cursor-pointer hover:bg-slate-200 duration-100 p-1"
            >
              <FontAwesomeIcon
                icon={faEllipsis}
                title="More"
                className="w-5 h-5"
                id={"expand-dropdown" + link.id}
              />
            </div>
            <div className="relative">
              <div className="flex flex-col items-end justify-center gap-1">
                <a
                  href={`/api/archives/${link.collectionId}/${link.id}.png`}
                  target="_blank"
                  rel="noreferrer"
                  title="Screenshot"
                >
                  <FontAwesomeIcon
                    icon={faFileImage}
                    className="w-5 h-5 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                  />
                </a>
                <a
                  href={`/api/archives/${link.collectionId}/${link.id}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  title="PDF"
                >
                  <FontAwesomeIcon
                    icon={faFilePdf}
                    className="w-5 h-5 text-sky-600 cursor-pointer hover:text-sky-500 duration-100"
                  />
                </a>
              </div>
            </div>

            {expandDropdown ? (
              <Dropdown
                items={[
                  {
                    name: "Edit",
                    onClick: () => {
                      setModal({
                        modal: "LINK",
                        state: true,
                        method: "UPDATE",
                        active: link,
                      });
                      setExpandDropdown(false);
                    },
                  },
                  {
                    name: "Delete",
                    onClick: () => {
                      removeLink(link);
                      setExpandDropdown(false);
                    },
                  },
                ]}
                onClickOutside={(e: Event) => {
                  const target = e.target as HTMLInputElement;
                  if (target.id !== "expand-dropdown" + link.id)
                    setExpandDropdown(false);
                }}
                className="absolute top-8 right-0 w-36"
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
