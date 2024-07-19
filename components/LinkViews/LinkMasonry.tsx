import {
  ArchivedFormat,
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useRef, useState } from "react";
import useLinkStore from "@/store/links";
import useCollectionStore from "@/store/collections";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import Image from "next/image";
import { previewAvailable } from "@/lib/shared/getArchiveValidity";
import Link from "next/link";
import LinkIcon from "./LinkComponents/LinkIcon";
import useOnScreen from "@/hooks/useOnScreen";
import { generateLinkHref } from "@/lib/client/generateLinkHref";
import useAccountStore from "@/store/account";
import usePermissions from "@/hooks/usePermissions";
import toast from "react-hot-toast";
import LinkTypeBadge from "./LinkComponents/LinkTypeBadge";
import { useTranslation } from "next-i18next";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
  flipDropdown?: boolean;
  editMode?: boolean;
};

export default function LinkMasonry({ link, flipDropdown, editMode }: Props) {
  const { t } = useTranslation();

  const { collections } = useCollectionStore();
  const { account } = useAccountStore();

  const { links, getLink, setSelectedLinks, selectedLinks } = useLinkStore();

  useEffect(() => {
    if (!editMode) {
      setSelectedLinks([]);
    }
  }, [editMode]);

  const handleCheckboxClick = (
    link: LinkIncludingShortenedCollectionAndTags
  ) => {
    if (selectedLinks.includes(link)) {
      setSelectedLinks(selectedLinks.filter((e) => e !== link));
    } else {
      setSelectedLinks([...selectedLinks, link]);
    }
  };

  let shortendURL;

  try {
    if (link.url) {
      shortendURL = new URL(link.url).host.toLowerCase();
    }
  } catch (error) {
    console.log(error);
  }

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );

  useEffect(() => {
    setCollection(
      collections.find(
        (e) => e.id === link.collection.id
      ) as CollectionIncludingMembersAndLinkCount
    );
  }, [collections, links]);

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const permissions = usePermissions(collection?.id as number);

  useEffect(() => {
    let interval: any;

    if (
      isVisible &&
      !link.preview?.startsWith("archives") &&
      link.preview !== "unavailable"
    ) {
      interval = setInterval(async () => {
        getLink(link.id as number);
      }, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isVisible, link.preview]);

  const [showInfo, setShowInfo] = useState(false);

  const selectedStyle = selectedLinks.some(
    (selectedLink) => selectedLink.id === link.id
  )
    ? "border-primary bg-base-300"
    : "border-neutral-content";

  const selectable =
    editMode &&
    (permissions === true || permissions?.canCreate || permissions?.canDelete);

  return (
    <div
      ref={ref}
      className={`${selectedStyle} border border-solid border-neutral-content bg-base-200 shadow-md hover:shadow-none duration-100 rounded-2xl relative`}
      onClick={() =>
        selectable
          ? handleCheckboxClick(link)
          : editMode
            ? toast.error(t("link_selection_error"))
            : undefined
      }
    >
      <div
        className="rounded-2xl cursor-pointer"
        onClick={() =>
          !editMode && window.open(generateLinkHref(link, account), "_blank")
        }
      >
        <div className="relative rounded-t-2xl overflow-hidden">
          {previewAvailable(link) ? (
            <Image
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true`}
              width={1280}
              height={720}
              alt=""
              className="rounded-t-2xl select-none object-cover z-10 h-40 w-full shadow opacity-80 scale-105"
              style={
                link.type !== "image" ? { filter: "blur(1px)" } : undefined
              }
              draggable="false"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />
          ) : link.preview === "unavailable" ? null : (
            <div className="duration-100 h-40 bg-opacity-80 skeleton rounded-none"></div>
          )}
          {link.type !== "image" && (
            <div className="absolute top-0 left-0 right-0 bottom-0 rounded-t-2xl flex items-center justify-center shadow rounded-md">
              <LinkIcon link={link} />
            </div>
          )}
        </div>

        {link.preview !== "unavailable" && (
          <hr className="divider my-0 last:hidden border-t border-neutral-content h-[1px]" />
        )}

        <div className="p-3 flex flex-col gap-2">
          <p className="hyphens-auto w-full pr-9 text-primary text-sm">
            {unescapeString(link.name)}
          </p>

          <LinkTypeBadge link={link} />

          {link.description && (
            <p className="hyphens-auto text-sm">
              {unescapeString(link.description)}
            </p>
          )}

          {link.tags && link.tags[0] && (
            <div className="flex gap-1 items-center flex-wrap">
              {link.tags.map((e, i) => (
                <Link
                  href={"/tags/" + e.id}
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="btn btn-xs btn-ghost truncate max-w-[19rem]"
                >
                  #{e.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <hr className="divider mt-2 mb-1 last:hidden border-t border-neutral-content h-[1px]" />

        <div className="flex flex-wrap justify-between text-xs text-neutral px-3 pb-1 w-full gap-x-2">
          {collection && <LinkCollection link={link} collection={collection} />}
          <LinkDate link={link} />
        </div>
      </div>

      {showInfo && (
        <div className="p-3 absolute z-30 top-0 left-0 right-0 bottom-0 bg-base-200 rounded-2xl fade-in overflow-y-auto">
          <div
            onClick={() => setShowInfo(!showInfo)}
            className=" float-right btn btn-sm outline-none btn-circle btn-ghost z-10"
          >
            <i className="bi-x text-neutral text-2xl"></i>
          </div>
          <p className="text-neutral text-lg font-semibold">
            {t("description")}
          </p>

          <hr className="divider my-2 last:hidden border-t border-neutral-content h-[1px]" />
          <p>
            {link.description ? (
              unescapeString(link.description)
            ) : (
              <span className="text-neutral text-sm">
                {t("no_description")}
              </span>
            )}
          </p>
          {link.tags && link.tags[0] && (
            <>
              <p className="text-neutral text-lg mt-3 font-semibold">
                {t("tags")}
              </p>

              <hr className="divider my-2 last:hidden border-t border-neutral-content h-[1px]" />

              <div className="flex gap-3 items-center flex-wrap mt-2 truncate relative">
                <div className="flex gap-1 items-center flex-wrap">
                  {link.tags.map((e, i) => (
                    <Link
                      href={"/tags/" + e.id}
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="btn btn-xs btn-ghost truncate max-w-[19rem]"
                    >
                      #{e.name}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <LinkActions
        link={link}
        collection={collection}
        position={
          link.preview !== "unavailable"
            ? "top-[10.75rem] right-3"
            : "top-[.75rem] right-3"
        }
        toggleShowInfo={() => setShowInfo(!showInfo)}
        linkInfo={showInfo}
        flipDropdown={flipDropdown}
      />
    </div>
  );
}
