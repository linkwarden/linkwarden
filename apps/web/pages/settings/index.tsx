import { useRouter } from "next/router";
import { useEffect } from "react";
import getServerSideProps from "@/lib/client/getServerSideProps";

export default function Settings() {
  const router = useRouter();

  useEffect(() => {
    router.push("/settings/account");
  }, []);
}

export { getServerSideProps };
