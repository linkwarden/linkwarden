import useCollectionSlice from "@/store/collections";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagSlice from "@/store/tags";
import useLinkSlice from "@/store/links";

export default function () {
  const { status } = useSession();
  const { setCollections } = useCollectionSlice();
  const { setTags } = useTagSlice();
  const { setLinks } = useLinkSlice();

  useEffect(() => {
    if (status === "authenticated") {
      setCollections();
      setTags();
      setLinks();
    }
  }, [status]);
}
