import getPublicCollectionData from "@/lib/client/getPublicCollectionData";
import { PublicCollectionIncludingLinks } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function PublicCollections() {
  const router = useRouter();

  const [data, setData] = useState<PublicCollectionIncludingLinks>();

  useEffect(() => {
    const init = async () => {
      if (router.query.id) {
        const data = await getPublicCollectionData(router.query.id as string);

        setData(data);
      }
    };

    init();
  }, []);

  return (
    <div>
      <p>Hello</p>
      {JSON.stringify(data)}
    </div>
  );
}
