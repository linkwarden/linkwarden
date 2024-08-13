import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import {
  LinkIncludingShortenedCollectionAndTags,
  ViewMode,
} from "@/types/global";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import LinkMasonry from "@/components/LinkViews/LinkComponents/LinkMasonry";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";
import { useMemo } from "react";
import LinkList from "@/components/LinkViews/LinkComponents/LinkList";

export function CardView({
  links,
  editMode,
  isLoading,
  placeholders,
  hasNextPage,
  placeHolderRef,
}: {
  links?: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
  placeholders?: number[];
  hasNextPage?: boolean;
  placeHolderRef?: any;
}) {
  return (
    <div className="grid min-[1901px]:grid-cols-5 min-[1501px]:grid-cols-4 min-[881px]:grid-cols-3 min-[551px]:grid-cols-2 grid-cols-1 gap-5 pb-5">
      {links?.map((e, i) => {
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

      {(hasNextPage || isLoading) &&
        placeholders?.map((e, i) => {
          return (
            <div
              className="flex flex-col gap-4"
              ref={e === 1 ? placeHolderRef : undefined}
              key={i}
            >
              <div className="skeleton h-40 w-full"></div>
              <div className="skeleton h-3 w-2/3"></div>
              <div className="skeleton h-3 w-full"></div>
              <div className="skeleton h-3 w-full"></div>
              <div className="skeleton h-3 w-1/3"></div>
            </div>
          );
        })}
    </div>
  );
}

export function ListView({
  links,
  editMode,
  isLoading,
  placeholders,
  hasNextPage,
  placeHolderRef,
}: {
  links?: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
  placeholders?: number[];
  hasNextPage?: boolean;
  placeHolderRef?: any;
}) {
  return (
    <div className="flex gap-1 flex-col">
      {links?.map((e, i) => {
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

export function MasonryView({
  links,
  editMode,
  isLoading,
  placeholders,
  hasNextPage,
  placeHolderRef,
}: {
  links?: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  isLoading?: boolean;
  placeholders?: number[];
  hasNextPage?: boolean;
  placeHolderRef?: any;
}) {
  const fullConfig = resolveConfig(tailwindConfig as any);

  const breakpointColumnsObj = useMemo(() => {
    return {
      default: 5,
      1900: 4,
      1500: 3,
      880: 2,
      550: 1,
    };
  }, []);

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      columnClassName="flex flex-col gap-5 !w-full"
      className="grid min-[1901px]:grid-cols-5 min-[1501px]:grid-cols-4 min-[881px]:grid-cols-3 min-[551px]:grid-cols-2 grid-cols-1 gap-5 pb-5"
    >
      {links?.map((e, i) => {
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
    </Masonry>
  );
}

export default function Links({
  layout,
  links,
  editMode,
  placeholderCount,
  useData,
}: {
  layout: ViewMode;
  links?: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  placeholderCount?: number;
  useData?: any;
}) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && useData?.fetchNextPage && useData?.hasNextPage) {
      useData.fetchNextPage();
    }
  }, [useData, inView]);

  if (layout === ViewMode.List) {
    return (
      <ListView
        links={links}
        editMode={editMode}
        isLoading={useData?.isLoading}
      />
    );
  } else if (layout === ViewMode.Masonry) {
    return (
      <MasonryView
        links={links}
        editMode={editMode}
        isLoading={useData?.isLoading}
      />
    );
  } else {
    // Default to card view
    return (
      <CardView
        links={links}
        editMode={editMode}
        isLoading={useData?.isLoading}
        placeholders={placeholderCountToArray(placeholderCount)}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
      />
    );
  }
}

const placeholderCountToArray = (num?: number) =>
  num ? Array.from({ length: num }, (_, i) => i + 1) : [];
