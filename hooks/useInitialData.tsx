import useCollectionStore from "@/store/collections";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagStore from "@/store/tags";
import useLinkStore from "@/store/links";
import useAccountStore from "@/store/account";

export default function useInitialData() {
  const { status, data } = useSession();
  const { setCollections } = useCollectionStore();
  const { setTags } = useTagStore();
  // const { setLinks } = useLinkStore();
  const { setAccount } = useAccountStore();

  useEffect(() => {
    if (
      status === "authenticated" &&
      (!process.env.NEXT_PUBLIC_STRIPE_IS_ACTIVE || data.user.isSubscriber)
    ) {
      setCollections();
      setTags();
      // setLinks();
      setAccount(data.user.id);
    }
  }, [status]);
}
