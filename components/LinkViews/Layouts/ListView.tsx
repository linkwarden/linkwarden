import LinkList from "@/components/LinkViews/LinkList";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function ListView({
  links,
  editMode,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
}) {
  return (
    <div className="flex gap-1 flex-col">
      {links.map((e, i) => {
        return (
          <LinkList
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
