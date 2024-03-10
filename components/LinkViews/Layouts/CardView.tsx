import LinkCard from "@/components/LinkViews/LinkCard";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { link } from "fs";
import { GridLoader } from "react-spinners";

export default function CardView({
  links,
  editMode,
  isLoading,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
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
