import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
  ViewMode,
} from "@linkwarden/types";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import LinkMasonry from "@/components/LinkViews/LinkComponents/LinkMasonry";
import Masonry from "react-masonry-css";
import { useMemo } from "react";
import LinkList from "@/components/LinkViews/LinkComponents/LinkList";
import useLocalSettingsStore from "@/store/localSettings";
import { useCollections } from "@linkwarden/router/collections";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { TFunction } from "i18next";
import useLinkStore from "@/store/links";

function CardView({
  links,
  collectionsById,
  isPublicRoute,
  t,
  isSelected,
  toggleSelected,
  editMode,
  isLoading,
  hasNextPage,
  placeHolderRef,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  isSelected: (id: number) => boolean;
  toggleSelected: (id: number) => void;
  editMode: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  placeHolderRef: any;
}) {
  const settings = useLocalSettingsStore((state) => state.settings);

  const gridMap = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
  };

  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1901) return 5;
    if (width >= 1501) return 4;
    if (width >= 881) return 3;
    if (width >= 551) return 2;
    return 1;
  };

  const [columnCount, setColumnCount] = useState(
    settings.columns || getColumnCount()
  );

  const gridColClass = useMemo(
    () => gridMap[columnCount as keyof typeof gridMap],
    [columnCount]
  );

  const heightMap = {
    1: "h-44",
    2: "h-40",
    3: "h-36",
    4: "h-32",
    5: "h-28",
    6: "h-24",
    7: "h-20",
    8: "h-20",
  };

  const imageHeightClass = useMemo(
    () =>
      columnCount ? heightMap[columnCount as keyof typeof heightMap] : "h-40",
    [columnCount]
  );

  useEffect(() => {
    const handleResize = () => {
      if (settings.columns === 0) {
        // Only recalculate if zustandColumns is zero
        setColumnCount(getColumnCount());
      }
    };

    if (settings.columns === 0) {
      window.addEventListener("resize", handleResize);
    }

    setColumnCount(settings.columns || getColumnCount());

    return () => {
      if (settings.columns === 0) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [settings.columns]);

  return (
    <div className={`${gridColClass} grid gap-5 pb-5`}>
      {links?.map((e) => {
        const collection = collectionsById.get(e.collection.id as number);
        const selected = isSelected(e.id as number);

        return (
          <LinkCard
            key={e.id}
            link={e}
            collection={collection as CollectionIncludingMembersAndLinkCount}
            isPublicRoute={isPublicRoute}
            t={t}
            isSelected={selected}
            toggleSelected={toggleSelected}
            editMode={editMode}
            imageHeightClass={imageHeightClass}
          />
        );
      })}

      {(hasNextPage || isLoading) && (
        <div className="flex flex-col gap-4" ref={placeHolderRef}>
          <div className="skeleton h-40 w-full"></div>
          <div className="skeleton h-3 w-2/3"></div>
          <div className="skeleton h-3 w-full"></div>
          <div className="skeleton h-3 w-full"></div>
          <div className="skeleton h-3 w-1/3"></div>
        </div>
      )}
    </div>
  );
}

function MasonryView({
  links,
  collectionsById,
  isPublicRoute,
  t,
  isSelected,
  toggleSelected,
  editMode,
  isLoading,
  hasNextPage,
  placeHolderRef,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  isSelected: (id: number) => boolean;
  toggleSelected: (id: number) => void;
  editMode: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  placeHolderRef: any;
}) {
  const settings = useLocalSettingsStore((state) => state.settings);

  const gridMap = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
  };

  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1901) return 5;
    if (width >= 1501) return 4;
    if (width >= 881) return 3;
    if (width >= 551) return 2;
    return 1;
  };

  const [columnCount, setColumnCount] = useState(
    settings.columns || getColumnCount()
  );

  const gridColClass = useMemo(
    () => gridMap[columnCount as keyof typeof gridMap],
    [columnCount]
  );

  const heightMap = {
    1: "h-44",
    2: "h-40",
    3: "h-36",
    4: "h-32",
    5: "h-28",
    6: "h-24",
    7: "h-20",
    8: "h-20",
  };

  const imageHeightClass = useMemo(
    () =>
      columnCount ? heightMap[columnCount as keyof typeof heightMap] : "h-40",
    [columnCount]
  );

  useEffect(() => {
    const handleResize = () => {
      if (settings.columns === 0) {
        // Only recalculate if zustandColumns is zero
        setColumnCount(getColumnCount());
      }
    };

    if (settings.columns === 0) {
      window.addEventListener("resize", handleResize);
    }

    setColumnCount(settings.columns || getColumnCount());

    return () => {
      if (settings.columns === 0) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [settings.columns]);

  const breakpointColumnsObj = { default: 5, 1900: 4, 1500: 3, 880: 2, 550: 1 };

  return (
    <Masonry
      breakpointCols={
        settings.columns === 0 ? breakpointColumnsObj : columnCount
      }
      columnClassName="flex flex-col gap-5 !w-full"
      className={`${gridColClass} grid gap-5 pb-5`}
    >
      {links?.map((e) => {
        const collection = collectionsById.get(e.collection.id as number);
        const selected = isSelected(e.id as number);

        return (
          <LinkMasonry
            key={e.id}
            link={e}
            collection={collection as CollectionIncludingMembersAndLinkCount}
            isPublicRoute={isPublicRoute}
            t={t}
            isSelected={selected}
            toggleSelected={toggleSelected}
            imageHeightClass={imageHeightClass}
            editMode={editMode}
          />
        );
      })}

      {(hasNextPage || isLoading) && (
        <div className="flex flex-col gap-4" ref={placeHolderRef}>
          <div className="skeleton h-40 w-full"></div>
          <div className="skeleton h-3 w-2/3"></div>
          <div className="skeleton h-3 w-full"></div>
          <div className="skeleton h-3 w-full"></div>
          <div className="skeleton h-3 w-1/3"></div>
        </div>
      )}
    </Masonry>
  );
}

function ListView({
  links,
  collectionsById,
  isPublicRoute,
  t,
  isSelected,
  toggleSelected,
  editMode,
  isLoading,
  hasNextPage,
  placeHolderRef,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  collectionsById: Map<number, CollectionIncludingMembersAndLinkCount>;
  isPublicRoute: boolean;
  t: TFunction<"translation", undefined>;
  isSelected: (id: number) => boolean;
  toggleSelected: (id: number) => void;
  editMode: boolean;
  isLoading: boolean;
  hasNextPage: boolean;
  placeHolderRef: any;
}) {
  return (
    <div className="flex flex-col">
      {links?.map((e, i) => {
        const collection = collectionsById.get(e.collection.id as number);
        const selected = isSelected(e.id as number);

        return (
          <LinkList
            key={e.id}
            link={e}
            collection={collection as CollectionIncludingMembersAndLinkCount}
            isPublicRoute={isPublicRoute}
            t={t}
            isSelected={selected}
            toggleSelected={toggleSelected}
            count={i}
            editMode={editMode}
          />
        );
      })}

      {(hasNextPage || isLoading) && (
        <div ref={placeHolderRef} className="flex gap-2 py-2 px-1">
          <div className="skeleton h-12 w-12"></div>
          <div className="flex flex-col gap-3 w-full">
            <div className="skeleton h-2 w-2/3"></div>
            <div className="skeleton h-2 w-full"></div>
            <div className="skeleton h-2 w-1/3"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Links({
  layout,
  links,
  editMode,
  useData,
}: {
  layout: ViewMode;
  links?: LinkIncludingShortenedCollectionAndTags[];
  editMode?: boolean;
  useData?: any;
}) {
  const { ref, inView } = useInView();

  const { t } = useTranslation();
  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  useEffect(() => {
    if (inView && useData?.fetchNextPage && useData?.hasNextPage) {
      useData.fetchNextPage();
    }
  }, [useData?.fetchNextPage, useData?.hasNextPage, inView]);

  const { data: collections = [] } = useCollections();

  const collectionsById = useMemo(() => {
    const m = new Map<number, (typeof collections)[number]>();
    for (const c of collections) m.set(c.id as any, c);
    return m;
  }, [collections]);

  const { clearSelected, isSelected, toggleSelected } = useLinkStore();

  useEffect(() => {
    if (!editMode) {
      clearSelected();
    }
  }, [editMode]);

  if (layout === ViewMode.List) {
    return (
      <ListView
        links={links || []}
        collectionsById={collectionsById}
        isPublicRoute={isPublicRoute}
        t={t}
        toggleSelected={toggleSelected}
        isSelected={isSelected}
        editMode={editMode || false}
        isLoading={useData?.isLoading}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
      />
    );
  } else if (layout === ViewMode.Masonry) {
    return (
      <MasonryView
        links={links || []}
        collectionsById={collectionsById}
        isPublicRoute={isPublicRoute}
        t={t}
        toggleSelected={toggleSelected}
        isSelected={isSelected}
        editMode={editMode || false}
        isLoading={useData?.isLoading}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
      />
    );
  } else {
    // Default to card view
    return (
      <CardView
        links={links || []}
        collectionsById={collectionsById}
        isPublicRoute={isPublicRoute}
        t={t}
        toggleSelected={toggleSelected}
        isSelected={isSelected}
        editMode={editMode || false}
        isLoading={useData?.isLoading}
        hasNextPage={useData?.hasNextPage}
        placeHolderRef={ref}
      />
    );
  }
}
