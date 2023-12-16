import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";

export default function LinkDate({
  link,
}: {
  link: LinkIncludingShortenedCollectionAndTags;
}) {
  const formattedDate = new Date(link.createdAt as string).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  return (
    <div className="flex items-center gap-1 text-neutral">
      <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
      <p>{formattedDate}</p>
    </div>
  );
}
