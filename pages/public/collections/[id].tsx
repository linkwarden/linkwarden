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
import ToggleDarkMode from "@/components/ToggleDarkMode";
import { useTheme } from "next-themes";
import getPublicUserData from "@/lib/client/getPublicUserData";
import Image from "next/image";
import Link from "next/link";
import PublicSearchBar from "@/components/PublicSearchBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSort } from "@fortawesome/free-solid-svg-icons";
import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import SortDropdown from "@/components/SortDropdown";

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

  useEffect(() => {
    modal
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [modal]);

  const { theme } = useTheme();

  const router = useRouter();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null,
    name: "",
    username: "",
    image: "",
  });

  useEffect(() => {}, []);

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
          theme === "dark" ? "#262626" : "#f3f4f6"
        } 50%, ${theme === "dark" ? "#171717" : "#ffffff"} 100%)`,
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
          <div className="flex gap-2 items-center mt-8">
            <ToggleDarkMode className="w-8 h-8 flex" />
            <Link href="https://linkwarden.app/" target="_blank">
              <Image
                src={`/icon.png`}
                width={551}
                height={551}
                alt="Linkwarden"
                title="Linkwarden"
                className="h-8 w-fit mx-auto"
              />
            </Link>
          </div>
        </div>

        <div>
          <div className={`min-w-[15rem]`}>
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
              className="hover:opacity-80 duration-100 flex justify-center sm:justify-end items-center w-fit cursor-pointer"
            >
              {collectionOwner.id ? (
                <ProfilePhoto
                  src={
                    collectionOwner.image ? collectionOwner.image : undefined
                  }
                  className={`w-8 h-8 border-2`}
                />
              ) : undefined}
              {collection.members
                .sort((a, b) => (a.userId as number) - (b.userId as number))
                .map((e, i) => {
                  return (
                    <ProfilePhoto
                      key={i}
                      src={e.user.image ? e.user.image : undefined}
                      className={`w-8 h-8 border-2`}
                    />
                  );
                })
                .slice(0, 3)}
              {collection?.members.length &&
              collection.members.length - 3 > 0 ? (
                <div className="w-8 h-8 text-white flex items-center justify-center rounded-full border-2 bg-sky-600 dark:bg-sky-600 border-slate-200 dark:border-neutral-700">
                  +{collection?.members?.length - 3}
                </div>
              ) : null}

              <p className="ml-2 text-gray-500 dark:text-gray-300">
                By {collectionOwner.name} and {collection.members.length}{" "}
                others.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5">{collection.description}</p>

        <hr className="mt-5 border-1 border-neutral-500" />

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
                  className="inline-flex rounded-md cursor-pointer hover:bg-neutral-500 hover:bg-opacity-40 duration-100 p-1"
                >
                  <FontAwesomeIcon
                    icon={faFilter}
                    id="filter-dropdown"
                    className="w-5 h-5 text-gray-500 dark:text-gray-300"
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
                  className="inline-flex rounded-md cursor-pointer hover:bg-neutral-500 hover:bg-opacity-40 duration-100 p-1"
                >
                  <FontAwesomeIcon
                    icon={faSort}
                    id="sort-dropdown"
                    className="w-5 h-5 text-gray-500 dark:text-gray-300"
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
    </div>
  ) : (
    <></>
  );
}
