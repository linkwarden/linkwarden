import {
  LinkIncludingShortenedCollectionAndTags,
  ViewMode,
} from "@/types/global";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import dynamic from "next/dynamic";

const CardView = dynamic(() =>
  import("./CardView").then((mod) => mod.CardView),
);
const MasonryView = dynamic(() =>
  import("./MasonryView").then((mod) => mod.MasonryView),
);
const ListView = dynamic(() =>
  import("./ListView").then((mod) => mod.ListView),
);


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

  const ViewComponents = {
    [ViewMode.List]: ListView,
    [ViewMode.Masonry]: MasonryView,
    [ViewMode.Card]: CardView,
  };

  const SelectedView =
    ViewComponents[layout] || ViewComponents[ViewMode.Card];  // Default to card view

  return (
    <SelectedView
      links={links}
      editMode={editMode}
      isLoading={useData?.isLoading}
      placeholders={placeholderCountToArray(placeholderCount)}
      hasNextPage={useData?.hasNextPage}
      placeHolderRef={ref}
    />
  );
}

const placeholderCountToArray = (num?: number) =>
  num ? Array.from({ length: num }, (_, i) => i + 1) : [];
