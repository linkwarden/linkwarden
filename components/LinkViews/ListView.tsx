import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import LinkList from "@/components/LinkViews/LinkComponents/LinkList";

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
    <div className="flex flex-col">
      {links?.map((e, i) => {
        return <LinkList key={i} link={e} count={i} editMode={editMode} />;
      })}

      {(hasNextPage || isLoading) &&
        placeholders?.map((e, i) => {
          return (
            <div
              ref={e === 1 ? placeHolderRef : undefined}
              key={i}
              className="flex gap-2 py-2 px-1"
            >
              <div className="skeleton h-12 w-12"></div>
              <div className="flex flex-col gap-3 w-full">
                <div className="skeleton h-2 w-2/3"></div>
                <div className="skeleton h-2 w-full"></div>
                <div className="skeleton h-2 w-1/3"></div>
              </div>
            </div>
          );
        })}
    </div>
  );
}