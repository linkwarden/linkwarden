import LinkCard from "@/components/LinkViews/LinkCard";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { GridLoader } from "react-spinners";
import Masonry from "react-masonry-css";

export default function MasonryView({
  links,
  editMode,
  isLoading,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Masonry
      breakpointCols={4}
      columnClassName="!w-full flex flex-col gap-5"
      className="grid min-[1900px]:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5"
    >
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
    </Masonry>
  );
}
