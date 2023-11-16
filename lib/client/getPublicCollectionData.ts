import { CollectionIncludingMembersAndLinkCount } from "@/types/global";
import { Dispatch, SetStateAction } from "react";

const getPublicCollectionData = async (
  collectionId: number,
  setData: Dispatch<
    SetStateAction<CollectionIncludingMembersAndLinkCount | undefined>
  >
) => {
  const res = await fetch("/api/v1/public/collections/" + collectionId);

  const data = await res.json();

  setData(data.response);

  return data;
};

export default getPublicCollectionData;
