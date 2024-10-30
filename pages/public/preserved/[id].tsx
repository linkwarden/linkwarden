import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import ReadableView from "@/components/ReadableView";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useGetLink } from "@/hooks/store/links";

export default function Index() {
  const getLink = useGetLink();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>();

  const router = useRouter();

  useEffect(() => {
    const fetchLink = async () => {
      if (router.query.id) {
        const get = await getLink.mutateAsync({ id: Number(router.query.id) });
        setLink(get);
      }
    };

    fetchLink();
  }, []);

  return (
    <div className="relative">
      {/* <div className="fixed left-1/2 transform -translate-x-1/2 w-fit py-1 px-3 bg-base-200 border border-neutral-content rounded-md">
        Readable
      </div> */}
      {link && Number(router.query.format) === ArchivedFormat.readability && (
        <ReadableView link={link} />
      )}
      {link && Number(router.query.format) === ArchivedFormat.monolith && (
        <iframe
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.monolith}`}
          className="w-full h-screen border-none"
        ></iframe>
      )}
      {link && Number(router.query.format) === ArchivedFormat.pdf && (
        <iframe
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.pdf}`}
          className="w-full h-screen border-none"
        ></iframe>
      )}
      {link && Number(router.query.format) === ArchivedFormat.png && (
        <img
          alt=""
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.png}`}
          className="w-fit mx-auto"
        />
      )}
      {link && Number(router.query.format) === ArchivedFormat.jpeg && (
        <img
          alt=""
          src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}`}
          className="w-fit mx-auto"
        />
      )}
    </div>
  );
}

export { getServerSideProps };
