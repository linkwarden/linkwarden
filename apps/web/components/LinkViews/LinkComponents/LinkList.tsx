import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import unescapeString from "@/lib/client/unescapeString";
import LinkActions from "@/components/LinkViews/LinkComponents/LinkActions";
import LinkDate from "@/components/LinkViews/LinkComponents/LinkDate";
import LinkCollection from "@/components/LinkViews/LinkComponents/LinkCollection";
import LinkIcon from "@/components/LinkViews/LinkComponents/LinkIcon";
import { isPWA } from "@/lib/client/utils";
import usePermissions from "@/hooks/usePermissions";
import toast from "react-hot-toast";
import LinkTypeBadge from "./LinkTypeBadge";
import { useTranslation } from "next-i18next";
import { useCollections } from "@/hooks/store/collections";
import { useUser } from "@/hooks/store/user";
import { useLinks } from "@/hooks/store/links";
import useLocalSettingsStore from "@/store/localSettings";
import LinkPin from "./LinkPin";
import { useRouter } from "next/router";
import { atLeastOneFormatAvailable } from "@/lib/shared/formatStats";
import LinkFormats from "./LinkFormats";
import openLink from "@/lib/client/openLink";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  count: number;
  className?: string;
  editMode?: boolean;
};

export default function LinkCardCompact({ link, editMode }: Props) {
  const { t } = useTranslation();

  const { data: collections = [] } = useCollections();

  const { data: user = {} } = useUser();
  const { setSelectedLinks, selectedLinks } = useLinkStore();

  const {
    settings: { show },
  } = useLocalSettingsStore();

  const { links } = useLinks();

  useEffect(() => {
    if (!editMode) {
      setSelectedLinks([]);
    }
  }, [editMode]);

  const handleCheckboxClick = (
    link: LinkIncludingShortenedCollectionAndTags
  ) => {
    const linkIndex = selectedLinks.findIndex(
      (selectedLink) => selectedLink.id === link.id
    );

    if (linkIndex !== -1) {
      const updatedLinks = [...selectedLinks];
      updatedLinks.splice(linkIndex, 1);
      setSelectedLinks(updatedLinks);
    } else {
      setSelectedLinks([...selectedLinks, link]);
    }
  };

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

  const permissions = usePermissions(collection?.id as number);

  const selectedStyle = selectedLinks.some(
    (selectedLink) => selectedLink.id === link.id
  )
    ? "border border-primary bg-base-300"
    : "border-transparent";

  const selectable =
    editMode &&
    (permissions === true || permissions?.canCreate || permissions?.canDelete);

  const router = useRouter();

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

  const [linkModal, setLinkModal] = useState(false);

  return (
    <>
      <div
        className={`${selectedStyle} rounded-md border relative group items-center flex ${
          !isPWA() ? "hover:bg-base-300 px-2 py-1" : "py-1"
        } duration-200`}
        onClick={() =>
          selectable
            ? handleCheckboxClick(link)
            : editMode
              ? toast.error(t("link_selection_error"))
              : undefined
        }
      >
        <div
          className="flex items-center cursor-pointer w-full min-h-12"
          onClick={() =>
            !editMode && openLink(link, user, () => setLinkModal(true))
          }
        >
          {show.icon && (
            <div className="shrink-0">
              <LinkIcon link={link} hideBackground />
            </div>
          )}

          <div className="w-[calc(100%-56px)] ml-2">
            {show.name && (
              <div className="flex gap-1 mr-20">
                <p className="truncate text-primary">
                  {unescapeString(link.name)}
                </p>
                {show.preserved_formats &&
                  link.type === "url" &&
                  atLeastOneFormatAvailable(link) && (
                    <div className="pl-1 inline-block text-lg">
                      <LinkFormats link={link} />
                    </div>
                  )}
              </div>
            )}

            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-neutral">
              <div className="flex items-center gap-x-3 text-neutral flex-wrap">
                {show.link && <LinkTypeBadge link={link} />}
                {show.collection && (
                  <LinkCollection link={link} collection={collection} />
                )}
                {show.date && <LinkDate link={link} />}
              </div>
            </div>
          </div>
        </div>
        {!isPublic && <LinkPin link={link} btnStyle="btn-ghost" />}
        <LinkActions
          link={link}
          collection={collection}
          btnStyle="btn-ghost"
          linkModal={linkModal}
          setLinkModal={(e) => setLinkModal(e)}
        />
      </div>
      <div className="last:hidden rounded-none my-0 mx-1 border-t border-base-300 h-[1px]"></div>
    </>
  );
}
