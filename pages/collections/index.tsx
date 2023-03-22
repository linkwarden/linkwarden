import { useSession } from "next-auth/react";
import useCollectionStore from "@/store/collections";

import CollectionCard from "@/components/CollectionCard";

export default function () {
  const { collections } = useCollectionStore();
  const { data: session, status } = useSession();

  const user = session?.user;

  return (
    // ml-80
    <div className="flex flex-wrap p-5">
      {collections.map((e, i) => {
        return <CollectionCard key={i} collection={e} />;
      })}
    </div>
  );
}
