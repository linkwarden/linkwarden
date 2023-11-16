"use client";
import LinkCard from "@/components/PublicPage/LinkCard";
import getPublicCollectionData from "@/lib/client/getPublicCollectionData";
import { CollectionIncludingMembersAndLinkCount, Sort } from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import Head from "next/head";
import useLinks from "@/hooks/useLinks";
import useLinkStore from "@/store/links";
import ProfilePhoto from "@/components/ProfilePhoto";
import useModalStore from "@/store/modals";
import ModalManagement from "@/components/ModalManagement";

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
  const { links } = useLinkStore();
  const { setModal } = useModalStore();

  const router = useRouter();

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    textContent: true,
    tags: true,
  });

  const [filterDropdown, setFilterDropdown] = useState(false);
  const [sortDropdown, setSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<Sort>(Sort.DateNewestFirst);

  useLinks({
    sort: sortBy,
    searchQueryString: router.query.q
      ? decodeURIComponent(router.query.q as string)
      : undefined,
    searchByName: searchFilter.name,
    searchByUrl: searchFilter.url,
    searchByDescription: searchFilter.description,
    searchByTextContent: searchFilter.textContent,
    searchByTags: searchFilter.tags,
  });

  const [collection, setCollection] =
    useState<CollectionIncludingMembersAndLinkCount>();

  document.body.style.background = "white";

  useEffect(() => {
    if (router.query.id) {
      getPublicCollectionData(Number(router.query.id), setCollection);
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

  return collection ? (
    <div
      className="h-screen"
      style={{
        backgroundImage: `linear-gradient(${collection?.color}30 10%, #f3f4f6 30%, #f9fafb 100%)`,
      }}
    >
      <ModalManagement />
      {collection ? (
        <Head>
          <title>{collection.name} | Linkwarden</title>
          <meta
            property="og:title"
            content={`${collection.name} | Linkwarden`}
            key="title"
          />
        </Head>
      ) : undefined}
      <div className="max-w-4xl mx-auto p-5 bg">
        <div className="flex items-center justify-between">
          <p className="text-4xl text-black font-thin mb-5 capitalize mt-10">
            {collection.name}
          </p>
          <div className="text-black">[Logo]</div>
        </div>

        <div>
          <div className={`min-w-[15rem] ${collection.members[1] && "mr-3"}`}>
            <div
              onClick={() =>
                setModal({
                  modal: "COLLECTION",
                  state: true,
                  method: "VIEW_TEAM",
                  isOwner: false,
                  active: collection,
                  defaultIndex: 0,
                })
              }
              className="hover:opacity-80 duration-100 flex justify-center sm:justify-end items-center w-fit sm:mr-0 sm:ml-auto cursor-pointer"
            >
              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e, i) => {
                  return (
                    <ProfilePhoto
                      key={i}
                      src={e.user.image ? e.user.image : undefined}
                      className={`${
                        collection.members[1] && "-mr-3"
                      } border-[3px]`}
                    />
                  );
                })
                .slice(0, 4)}
              {collection?.members.length &&
              collection.members.length - 4 > 0 ? (
                <div className="h-10 w-10 text-white flex items-center justify-center rounded-full border-[3px] bg-sky-600 dark:bg-sky-600 border-slate-200 dark:border-neutral-700 -mr-3">
                  +{collection?.members?.length - 4}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <p className="mt-2 text-black">{collection.description}</p>

        <hr className="mt-5 border-1 border-slate-400" />

        <div className="flex flex-col gap-5 my-8">
          {links
            ?.filter((e) => e.collectionId === Number(router.query.id))
            .map((e, i) => {
              return (
                <motion.div
                  key={i}
                  initial="offscreen"
                  whileInView="onscreen"
                  viewport={{ once: true, amount: 0.8 }}
                >
                  <motion.div variants={cardVariants}>
                    <LinkCard link={e as any} count={i} />
                  </motion.div>
                </motion.div>
              );
            })}
        </div>

        {/* <p className="text-center text-gray-500">
      List created with <span className="text-black">Linkwarden.</span>
    </p> */}
      </div>
    </div>
  ) : (
    <></>
  );
}
