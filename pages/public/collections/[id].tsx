"use client";
import PublicLinkCard from "@/components/PublicPage/PublicLinkCard";
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
import ToggleDarkMode from "@/components/ToggleDarkMode";
import getPublicUserData from "@/lib/client/getPublicUserData";
import Image from "next/image";
import Link from "next/link";
import PublicSearchBar from "@/components/PublicPage/PublicSearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSort } from "@fortawesome/free-solid-svg-icons";
import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import SortDropdown from "@/components/SortDropdown";
import useLocalSettingsStore from "@/store/localSettings";

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
  const { modal, setModal } = useModalStore();

  const { settings } = useLocalSettingsStore();

  useEffect(() => {
    modal
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [modal]);

  const router = useRouter();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null,
    name: "",
    username: "",
    image: "",
  });

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

  useEffect(() => {
    if (router.query.id) {
      getPublicCollectionData(Number(router.query.id), setCollection);
    }
  }, []);

  useEffect(() => {
    const fetchOwner = async () => {
      if (collection) {
        const owner = await getPublicUserData(collection.ownerId as number);
        setCollectionOwner(owner);
      }
    };

    fetchOwner();
  }, [collection]);

  return collection ? (
    <div
      className="h-screen"
      style={{
        backgroundImage: `linear-gradient(${collection?.color}30 10%, ${
          settings.theme === "dark" ? "#262626" : "#f3f4f6"
        } 50%, ${settings.theme === "dark" ? "#171717" : "#ffffff"} 100%)`,
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
          <p className="text-4xl font-thin mb-2 capitalize mt-10">
            {collection.name}
          </p>
          <div className="flex gap-2 items-center mt-8 min-w-fit">
            <ToggleDarkMode />
            <Link href="https://linkwarden.app/" target="_blank">
              <Image
                src={`/icon.png`}
                width={551}
                height={551}
                alt="Linkwarden"
                title="Linkwarden"
                className="h-8 w-fit mx-auto rounded"
              />
            </Link>
          </div>
        </div>

        <div className="mt-3">
          <div className={`min-w-[15rem]`}>
            <div className="flex justify-center sm:justify-end items-start w-fit">
              {collectionOwner.id ? (
                <ProfilePhoto
                  src={collectionOwner.image || undefined}
                  className="w-7 h-7"
                />
              ) : undefined}
              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e, i) => {
                  return (
                    <ProfilePhoto
                      key={i}
                      src={e.user.image ? e.user.image : undefined}
                      className="w-7 h-7"
                    />
                  );
                })
                .slice(0, 4)}
              {collection?.members.length &&
              collection.members.length - 3 > 0 ? (
                <div className={`avatar placeholder`}>
                  <div className="bg-base-100 text-base-content rounded-full w-8 h-8 ring-2 ring-base-content">
                    <span>+{collection.members.length - 3}</span>
                  </div>
                </div>
              ) : null}

              <p className="ml-3 mt-1 text-neutral text-xs">
                By
                <span
                  className="btn btn-ghost btn-xs p-1"
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
                >
                  {collectionOwner.name}
                  {collection.members.length > 0
                    ? ` and ${collection.members.length} others`
                    : undefined}
                </span>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5">{collection.description}</p>

        <hr className="mt-5 border-1 border-neutral" />

        <div className="flex mb-5 mt-10 flex-col gap-5">
          <div className="flex justify-between">
            <PublicSearchBar
              placeHolder={`Search ${collection._count?.links} Links`}
            />

            <div className="flex gap-3 items-center">
              <div className="relative">
                <div
                  onClick={() => setFilterDropdown(!filterDropdown)}
                  id="filter-dropdown"
                  className="btn btn-ghost btn-square btn-sm"
                >
                  <FontAwesomeIcon
                    icon={faFilter}
                    id="filter-dropdown"
                    className="w-5 h-5 text-neutral"
                  />
                </div>

                {filterDropdown ? (
                  <FilterSearchDropdown
                    setFilterDropdown={setFilterDropdown}
                    searchFilter={searchFilter}
                    setSearchFilter={setSearchFilter}
                  />
                ) : null}
              </div>

              <div className="relative">
                <div
                  onClick={() => setSortDropdown(!sortDropdown)}
                  id="sort-dropdown"
                  className="btn btn-ghost btn-square btn-sm"
                >
                  <FontAwesomeIcon
                    icon={faSort}
                    id="sort-dropdown"
                    className="w-5 h-5 text-neutral"
                  />
                </div>

                {sortDropdown ? (
                  <SortDropdown
                    sortBy={sortBy}
                    setSort={setSortBy}
                    toggleSortDropdown={() => setSortDropdown(!sortDropdown)}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
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
                      <PublicLinkCard link={e as any} count={i} />
                    </motion.div>
                  </motion.div>
                );
              })}
          </div>

          {/* <p className="text-center text-neutral">
        List created with <span className="text-black">Linkwarden.</span>
        </p> */}
        </div>
      </div>
    </div>
  ) : (
    <></>
  );
}
