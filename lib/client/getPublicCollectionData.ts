import {
  PublicCollectionIncludingLinks,
  PublicLinkRequestQuery,
} from "@/types/global";
import { Dispatch, SetStateAction } from "react";

const getPublicCollectionData = async (
  collectionId: number,
  prevData: PublicCollectionIncludingLinks,
  setData: Dispatch<SetStateAction<PublicCollectionIncludingLinks | undefined>>
) => {
  const requestBody: PublicLinkRequestQuery = {
    cursor: prevData?.links?.at(-1)?.id,
    collectionId,
  };

  const encodedData = encodeURIComponent(JSON.stringify(requestBody));

  const res = await fetch(
    "/api/v1/public/collections?body=" + encodeURIComponent(encodedData)
  );

  const data = await res.json();

  prevData
    ? setData({
        ...data.response,
        links: [...prevData.links, ...data.response.links],
      })
    : setData(data.response);

  return data;
};

export default getPublicCollectionData;
