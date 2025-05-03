import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Settings() {
  const router = useRouter();

  useEffect(() => {
    router.push("/settings/profile");
  }, []);
}
