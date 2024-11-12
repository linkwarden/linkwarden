import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { ArchivedFormat } from "@/types/global";
import ReadableView from "@/components/ReadableView";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useGetLink } from "@/hooks/store/links";
import clsx from "clsx";

export default function Index() {
  const getLink = useGetLink();

  const router = useRouter();

  useEffect(() => {
    if (router.query.id) {
      getLink.mutateAsync({ id: Number(router.query.id) });
    }
  }, []);

  return (
    <div className={clsx(getLink.isPending ? "flex h-screen" : "relative")}>
      {/* <div className="fixed left-1/2 transform -translate-x-1/2 w-fit py-1 px-3 bg-base-200 border border-neutral-content rounded-md">
        Readable
      </div> */}
      {getLink.data?.id &&
      Number(router.query.format) === ArchivedFormat.readability ? (
        <ReadableView link={getLink.data} />
      ) : getLink.data?.id &&
        Number(router.query.format) === ArchivedFormat.monolith ? (
        <iframe
          src={`/api/v1/archives/${getLink.data.id}?format=${ArchivedFormat.monolith}`}
          className="w-full h-screen border-none"
        ></iframe>
      ) : getLink.data?.id &&
        Number(router.query.format) === ArchivedFormat.pdf ? (
        <iframe
          src={`/api/v1/archives/${getLink.data.id}?format=${ArchivedFormat.pdf}`}
          className="w-full h-screen border-none"
        ></iframe>
      ) : getLink.data?.id &&
        Number(router.query.format) === ArchivedFormat.png ? (
        <img
          alt=""
          src={`/api/v1/archives/${getLink.data.id}?format=${ArchivedFormat.png}`}
          className="w-fit mx-auto"
        />
      ) : getLink.data?.id &&
        Number(router.query.format) === ArchivedFormat.jpeg ? (
        <img
          alt=""
          src={`/api/v1/archives/${getLink.data.id}?format=${ArchivedFormat.jpeg}`}
          className="w-fit mx-auto"
        />
      ) : getLink.error ? (
        <p>404 - Not found</p>
      ) : (
        <div className="max-w-3xl p-5 m-auto w-full flex flex-col items-center gap-5">
          <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-3/4 mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-full mr-auto h-4 skeleton rounded-md"></div>
          <div className="w-5/6 mr-auto h-4 skeleton rounded-md"></div>
        </div>
      )}
    </div>
  );
}

export { getServerSideProps };
