import LinkDetails from "@/components/LinkDetails";
import { useGetLink } from "@/hooks/store/links";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import getServerSideProps from "@/lib/client/getServerSideProps";

const Index = () => {
  const router = useRouter();
  const { id } = router.query;

  useState;

  const getLink = useGetLink();

  useEffect(() => {
    getLink.mutate({ id: Number(id) });
  }, []);

  return (
    <div className="flex h-screen">
      {getLink.data ? (
        <div className="m-auto py-20 w-full">
          <LinkDetails
            link={getLink.data}
            className="max-w-xl mx-auto p-5 w-full"
          />
        </div>
      ) : (
        <div className="max-w-xl p-5 m-auto w-full flex flex-col items-center gap-5">
          <div className="w-20 h-20 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
          <div className="w-full h-10 skeleton rounded-xl"></div>
        </div>
      )}
    </div>
  );
};

export default Index;

export { getServerSideProps };
