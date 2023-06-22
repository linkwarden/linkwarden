import useAccountStore from "@/store/account";
import useCollectionStore from "@/store/collections";
import { Member } from "@/types/global";
import { useEffect, useState } from "react";

export default function usePermissions(collectionId: number) {
  const { collections } = useCollectionStore();

  const { account } = useAccountStore();

  const [permissions, setPermissions] = useState<Member | true>();
  useEffect(() => {
    const collection = collections.find((e) => e.id === collectionId);

    if (collection) {
      let getPermission: Member | undefined = collection.members.find(
        (e) => e.userId === account.id
      );

      if (
        getPermission?.canCreate === false &&
        getPermission?.canUpdate === false &&
        getPermission?.canDelete === false
      )
        getPermission = undefined;

      setPermissions(account.id === collection.ownerId || getPermission);
    }
  }, [account, collections, collectionId]);

  return permissions;
}
