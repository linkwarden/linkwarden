import LinkCard from "@/components/PublicPage/LinkCard";
import useDetectPageBottom from "@/hooks/useDetectPageBottom";
import getPublicCollectionData from "@/lib/client/getPublicCollectionData";
import { PublicCollectionIncludingLinks } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

export default function PublicCollections() {
  const router = useRouter();
  const hasReachedBottom = useDetectPageBottom();

  const [data, setData] = useState<PublicCollectionIncludingLinks>();

  useEffect(() => {
    if (router.query.id) {
      getPublicCollectionData(
        Number(router.query.id),
        data as PublicCollectionIncludingLinks,
        setData
      );
    }

    // document
    //   .querySelector("body")
    //   ?.classList.add(
    //     "bg-gradient-to-br",
    //     "from-slate-50",
    //     "to-sky-50",
    //     "min-h-screen"
    //   );
  }, []);

  useEffect(() => {
    if (hasReachedBottom && router.query.id) {
      getPublicCollectionData(
        Number(router.query.id),
        data as PublicCollectionIncludingLinks,
        setData
      );
    }
  }, [hasReachedBottom]);

  return data ? (
    <div className="max-w-4xl mx-auto p-5 bg">
      <div
        className={`text-center bg-gradient-to-tr from-sky-100 from-10% via-gray-100 via-20% rounded-3xl shadow-lg p-5`}
      >
        <p className="text-5xl text-sky-700 font-bold mb-5 capitalize">
          {data.name}
        </p>

        {data.description && (
          <>
            <hr className="mt-5 max-w-[30rem] mx-auto border-1 border-slate-400" />
            <p className="mt-2 text-gray-500">{data.description}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-5 my-8">
        {data?.links?.map((e, i) => {
          return <LinkCard key={i} link={e} count={i} />;
        })}
      </div>

      {/* <p className="text-center font-bold text-gray-500">
        List created with <span className="text-sky-700">Linkwarden.</span>
      </p> */}
    </div>
  ) : (
    <></>
  );
}
