import {
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useEffect, useState } from "react";
import LinkMasonry from "@/components/LinkViews/LinkComponents/LinkMasonry";
import Masonry from "react-masonry-css";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "../../tailwind.config.js";
import { useMemo } from "react";
import useLocalSettingsStore from "@/store/localSettings";

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
    settings.columns || getColumnCount(),
  );

  const gridColClass = useMemo(
    () => gridMap[columnCount as keyof typeof gridMap],
    [columnCount],
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
      breakpointCols={
        settings.columns === 0 ? breakpointColumnsObj : columnCount
      }
      columnClassName="flex flex-col gap-5 !w-full"
      className={`${gridColClass} grid gap-5 pb-5`}
    >
      {links?.map((e, i) => {
        return (
          <LinkMasonry
            key={i}
            link={e}
            editMode={editMode}
            columns={columnCount}
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
    </Masonry>
  );
}