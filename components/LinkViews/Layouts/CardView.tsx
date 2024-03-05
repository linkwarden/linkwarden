import LinkCard from "@/components/LinkViews/LinkCard";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function CardView({
  links,
  showCheckbox = true,
  editMode,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  showCheckbox?: boolean;
  editMode?: boolean;
}) {
  return (
    <div className="grid min-[1900px]:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5">
      {links.map((e, i) => {
        return (
          <LinkCard
            key={i}
            link={e}
            count={i}
            flipDropdown={i === links.length - 1}
            editMode={editMode}
          />
        );
      })}
    </div>
  );
}
