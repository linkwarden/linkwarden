import useCollectionSlice from "@/store/collection";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useTagSlice from "@/store/tags";

export default function () {
  const { status } = useSession();
  const { setCollections } = useCollectionSlice();
  const { setTags } = useTagSlice();

  useEffect(() => {
    if (status === "authenticated") {
      setCollections();
      setTags();
    }
  }, [status]);
}
