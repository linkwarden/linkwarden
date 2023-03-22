import useCollectionStore from "@/store/collections";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagStore from "@/store/tags";
import useLinkStore from "@/store/links";

export default function () {
  const { status } = useSession();
  const { setCollections } = useCollectionStore();
  const { setTags } = useTagStore();
  const { setLinks } = useLinkStore();

  useEffect(() => {
    if (status === "authenticated") {
      setCollections();
      setTags();
      setLinks();
    }
  }, [status]);
}
