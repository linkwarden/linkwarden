import useAccountStore from "@/store/account";
import useCollectionStore from "@/store/collections";
import { Member } from "@/types/global";
import { useMemo } from "react";

export default function usePermissions(collectionId: number) {
  const { collections } = useCollectionStore();
  const { account } = useAccountStore();

  const permissions = useMemo(() => {
    const collection = collections.find((e) => e.id === collectionId);

    if (collection) {
      let getPermission: Member | undefined = collection.members.find(
        (e) => e.userId === account.id
      );

      if (
        getPermission?.canCreate === false &&
        getPermission?.canUpdate === false &&
        getPermission?.canDelete === false
      ) {
        getPermission = undefined;
      }

      return account.id === collection.ownerId || getPermission;
    }
  }, [account, collections, collectionId]);

  return permissions;
}