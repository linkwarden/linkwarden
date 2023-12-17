import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";

export default function LinkCollection({
  link,
  collection,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
  collection: CollectionIncludingMembersAndLinkCount;
}) {
  const router = useRouter();

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/collections/${link.collection.id}`);
      }}
      className="flex items-center gap-1 max-w-full w-fit hover:opacity-70 duration-100"
    >
      <FontAwesomeIcon
        icon={faFolder}
        className="w-4 h-4 shadow"
        style={{ color: collection?.color }}
      />
      <p className="truncate capitalize">{collection?.name}</p>
    </div>
  );
}
