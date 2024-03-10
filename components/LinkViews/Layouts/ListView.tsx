import LinkList from "@/components/LinkViews/LinkList";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { GridLoader } from "react-spinners";

export default function ListView({
  links,
  editMode,
  isLoading,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
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

      {isLoading && links.length > 0 && (
        <GridLoader
          color="oklch(var(--p))"
          loading={true}
          size={20}
          className="fixed top-5 right-5 opacity-50 z-30"
        />
      )}
    </div>
  );
}
