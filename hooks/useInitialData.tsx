import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagStore from "@/store/tags";
import useLocalSettingsStore from "@/store/localSettings";
import { useUser } from "./store/user";

export default function useInitialData() {
  const { status, data } = useSession();
  // const { setCollections } = useCollectionStore();
  const { setTags } = useTagStore();
  // const { setLinks } = useLinkStore();
  const { data: user = [] } = useUser();
  const { setSettings } = useLocalSettingsStore();

  useEffect(() => {
    setSettings();
  }, [status, data]);

  // Get the rest of the data
  useEffect(() => {
    if (user.id && (!process.env.NEXT_PUBLIC_STRIPE || user.username)) {
      // setCollections();
      setTags();
      // setLinks();
    }
  }, [user]);

  return status;
}
