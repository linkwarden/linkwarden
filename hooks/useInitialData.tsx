import useCollectionStore from "@/store/collections";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagStore from "@/store/tags";
import useAccountStore from "@/store/account";
import useLocalSettingsStore from "@/store/localSettings";

export default function useInitialData() {
  const { status, data } = useSession();
  const { setCollections } = useCollectionStore();
  const { setTags } = useTagStore();
  // const { setLinks } = useLinkStore();
  const { account, setAccount } = useAccountStore();
  const { setSettings } = useLocalSettingsStore();

  useEffect(() => {
    setSettings();
    if (status === "authenticated") {
      // Get account info
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
