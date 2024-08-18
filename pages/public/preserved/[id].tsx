import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import ReadableView from "@/components/ReadableView";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useGetLink, useLinks } from "@/hooks/store/links";

export default function Index() {
  const { links } = useLinks();
  const getLink = useGetLink();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>();

  const router = useRouter();

  useEffect(() => {
    const fetchLink = async () => {
      if (router.query.id) {
        await getLink.mutateAsync(Number(router.query.id));
      }
    };

    fetchLink();
  }, []);

  useEffect(() => {
    if (links && links[0])
      setLink(links.find((e) => e.id === Number(router.query.id)));
  }, [links]);

  return (
    <div className="relative">
      {/* <div className="fixed left-1/2 transform -translate-x-1/2 w-fit py-1 px-3 bg-base-200 border border-neutral-content rounded-md">
        Readable
      </div> */}
      {link && Number(router.query.format) === ArchivedFormat.readability && (
        <ReadableView link={link} />
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
