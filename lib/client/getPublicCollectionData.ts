import { PublicCollectionIncludingLinks } from "@/types/global";
import { Dispatch, SetStateAction } from "react";

const getPublicCollectionData = async (
  collectionId: string,
  prevData: PublicCollectionIncludingLinks,
  setData: Dispatch<SetStateAction<PublicCollectionIncludingLinks | undefined>>
) => {
  const res = await fetch(
    "/api/public/routes/collections?collectionId=" +
      collectionId +
      "&cursor=" +
      prevData?.links?.at(-1)?.id
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
