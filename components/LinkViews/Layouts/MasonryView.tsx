import LinkMasonry from "@/components/LinkViews/LinkMasonry";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { GridLoader } from "react-spinners";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../../tailwind.config.js";
import { useMemo } from "react";

export default function MasonryView({
  links,
  editMode,
  isLoading,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
}) {
  const fullConfig = resolveConfig(tailwindConfig as any);

  const breakpointColumnsObj = useMemo(() => {
    return {
      default: 4,
      1900: 3,
      [fullConfig.theme.screens.xl]: 2,
      [fullConfig.theme.screens.sm]: 1,
    };
  }, []);

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      columnClassName="flex flex-col gap-5 !w-full"
      className="grid min-[1900px]:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-5 pb-5"
    >
      {links.map((e, i) => {
        return (
          <LinkMasonry
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
