import { useRouter } from "next/router";
import { useEffect } from "react";
import getServerSideProps from "@/lib/client/getServerSideProps";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, []);
}

export { getServerSideProps };
