import LinkCard from "@/components/LinkViews/LinkCard";
import { useLinks } from "@/hooks/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
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
  const { ref, inView } = useInView();

  const { data } = useLinks();

  useEffect(() => {
    if (inView) {
      data.fetchNextPage();
    }
  }, [data.fetchNextPage, inView]);

  return (
    <div className="grid min-[1901px]:grid-cols-5 min-[1501px]:grid-cols-4 min-[881px]:grid-cols-3 min-[551px]:grid-cols-2 grid-cols-1 gap-5 pb-5">
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

      {data.hasNextPage && (
        <div className="flex flex-col gap-4" ref={ref}>
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-4 w-28"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-full"></div>
        </div>
      )}

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
