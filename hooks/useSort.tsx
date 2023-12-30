import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
  Sort,
} from "@/types/global";
import { SetStateAction, useEffect } from "react";

type Props<
  T extends
    | CollectionIncludingMembersAndLinkCount
    | LinkIncludingShortenedCollectionAndTags,
> = {
  sortBy: Sort;

  data: T[];
  setData: (value: SetStateAction<T[]>) => void;
};

export default function useSort<
  T extends
    | CollectionIncludingMembersAndLinkCount
    | LinkIncludingShortenedCollectionAndTags,
>({ sortBy, data, setData }: Props<T>) {
  useEffect(() => {
    const dataArray = [...data];

    if (sortBy === Sort.NameAZ)
      setData(dataArray.sort((a, b) => a.name.localeCompare(b.name)));
    else if (sortBy === Sort.DescriptionAZ)
      setData(
        dataArray.sort((a, b) => a.description.localeCompare(b.description))
      );
    else if (sortBy === Sort.NameZA)
      setData(dataArray.sort((a, b) => b.name.localeCompare(a.name)));
    else if (sortBy === Sort.DescriptionZA)
      setData(
        dataArray.sort((a, b) => b.description.localeCompare(a.description))
      );
    else if (sortBy === Sort.DateNewestFirst)
      setData(
        dataArray.sort(
          (a, b) =>
            new Date(b.createdAt as string).getTime() -
            new Date(a.createdAt as string).getTime()
        )
      );
    else if (sortBy === Sort.DateOldestFirst)
      setData(
        dataArray.sort(
          (a, b) =>
            new Date(a.createdAt as string).getTime() -
            new Date(b.createdAt as string).getTime()
        )
      );
  }, [sortBy, data]);
}
