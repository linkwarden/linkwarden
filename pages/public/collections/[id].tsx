"use client";
import LinkCard from "@/components/PublicPage/LinkCard";
import useDetectPageBottom from "@/hooks/useDetectPageBottom";
import getPublicCollectionData from "@/lib/client/getPublicCollectionData";
import { PublicCollectionIncludingLinks } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import Head from "next/head";

const cardVariants: Variants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

export default function PublicCollections() {
  const router = useRouter();
  const { reachedBottom, setReachedBottom } = useDetectPageBottom();

  const [data, setData] = useState<PublicCollectionIncludingLinks>();

  document.body.style.background = "white";

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
    if (reachedBottom && router.query.id) {
      getPublicCollectionData(
        Number(router.query.id),
        data as PublicCollectionIncludingLinks,
        setData
      );
    }

    setReachedBottom(false);
  }, [reachedBottom]);

  return data ? (
    <div className="max-w-4xl mx-auto p-5 bg">
      {data ? (
        <Head>
          <title>{data.name} | Linkwarden</title>
          <meta
            property="og:title"
            content={`${data.name} | Linkwarden`}
            key="title"
          />
        </Head>
      ) : undefined}
      <div
        className={`border border-solid border-sky-100 text-center bg-gradient-to-tr from-sky-100 from-10% via-gray-100 via-20% rounded-3xl shadow-lg p-5`}
      >
        <p className="text-5xl text-black mb-5 capitalize">{data.name}</p>

        {data.description && (
          <>
            <hr className="mt-5 max-w-[30rem] mx-auto border-1 border-slate-400" />
            <p className="mt-2 text-gray-500">{data.description}</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-5 my-8">
        {data?.links?.map((e, i) => {
          return (
            <motion.div
              key={i}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.8 }}
            >
              <motion.div variants={cardVariants}>
                <LinkCard link={e} count={i} />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* <p className="text-center font-bold text-gray-500">
        List created with <span className="text-black">Linkwarden.</span>
      </p> */}
    </div>
  ) : (
    <></>
  );
}
