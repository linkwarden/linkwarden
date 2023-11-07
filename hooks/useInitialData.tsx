import useCollectionStore from "@/store/collections";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagStore from "@/store/tags";
import useAccountStore from "@/store/account";

export default function useInitialData() {
  const { status, data } = useSession();
  const { setCollections } = useCollectionStore();
  const { setTags } = useTagStore();
  // const { setLinks } = useLinkStore();
  const { account, setAccount } = useAccountStore();

  // Get account info
  useEffect(() => {
    if (status === "authenticated") {
      setAccount(data?.user.id as number);
    }
  }, [status, data]);

  // Get the rest of the data
  useEffect(() => {
    if (account.id && (!process.env.NEXT_PUBLIC_STRIPE || account.username)) {
      setCollections();
      setTags();
      // setLinks();
    }
  }, [account]);
}
