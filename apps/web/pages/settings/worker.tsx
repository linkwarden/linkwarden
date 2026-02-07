// Redirect to /settings/worker-console page, thats it!

import { ReactElement } from "react";
import { NextPageWithLayout } from "../_app";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Page: NextPageWithLayout = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/worker-console");
  }, [router]);

  return null;
};

export default Page;

Page.getLayout = function getLayout(page: ReactElement) {
  return page;
};
