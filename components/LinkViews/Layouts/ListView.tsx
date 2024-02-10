import LinkList from "@/components/LinkViews/LinkList";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";

export default function ListView({
  links,
  showCheckbox = true
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  showCheckbox?: boolean;
}) {
  return (
    <div className="flex flex-col">
      {links.map((e, i) => {
        return (
          <LinkList
            key={i}
            link={e}
            count={i}
            showCheckbox={showCheckbox}
            flipDropdown={i === links.length - 1}
          />
        );
      })}
    </div>
  );
}
