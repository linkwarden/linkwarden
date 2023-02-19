import useCollectionSlice from "@/store/collection";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function getInitialData() {
  const { status } = useSession();
  const { setCollections } = useCollectionSlice();

  useEffect(() => {
    if (status === "authenticated") {
      setCollections();
    }
  }, [status]);
}
