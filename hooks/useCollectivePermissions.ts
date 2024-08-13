import { Member } from "@/types/global";
import { useEffect, useState } from "react";
import { useCollections } from "./store/collections";
import { useUser } from "./store/user";

export default function useCollectivePermissions(collectionIds: number[]) {
  const { data: collections = [] } = useCollections();

  const { data: user = {} } = useUser();

  const [permissions, setPermissions] = useState<Member | true>();
  useEffect(() => {
    for (const collectionId of collectionIds) {
      const collection = collections.find((e) => e.id === collectionId);

      if (collection) {
        let getPermission: Member | undefined = collection.members.find(
          (e) => e.userId === user.id
        );

        if (
          getPermission?.canCreate === false &&
          getPermission?.canUpdate === false &&
          getPermission?.canDelete === false
        )
          getPermission = undefined;

        setPermissions(user.id === collection.ownerId || getPermission);
      }
    }
  }, [user, collections, collectionIds]);

  return permissions;
}
