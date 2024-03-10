"use client";
import getPublicCollectionData from "@/lib/client/getPublicCollectionData";
import {
  CollectionIncludingMembersAndLinkCount,
  Sort,
  ViewMode,
} from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import Head from "next/head";
import useLinks from "@/hooks/useLinks";
import useLinkStore from "@/store/links";
import ProfilePhoto from "@/components/ProfilePhoto";
import ToggleDarkMode from "@/components/ToggleDarkMode";
import getPublicUserData from "@/lib/client/getPublicUserData";
import Image from "next/image";
import Link from "next/link";
import FilterSearchDropdown from "@/components/FilterSearchDropdown";
import SortDropdown from "@/components/SortDropdown";
import useLocalSettingsStore from "@/store/localSettings";
import SearchBar from "@/components/SearchBar";
import EditCollectionSharingModal from "@/components/ModalContent/EditCollectionSharingModal";
import ViewDropdown from "@/components/ViewDropdown";
import CardView from "@/components/LinkViews/Layouts/CardView";
import ListView from "@/components/LinkViews/Layouts/ListView";
// import GridView from "@/components/LinkViews/Layouts/GridView";

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

  const { settings } = useLocalSettingsStore();

  const router = useRouter();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    tags: true,
    textContent: false,
  });

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

  const [editCollectionSharingModal, setEditCollectionSharingModal] =
    useState(false);

  const [viewMode, setViewMode] = useState<string>(
    localStorage.getItem("viewMode") || ViewMode.Card
  );

  const linkView = {
    [ViewMode.Card]: CardView,
    // [ViewMode.Grid]: GridView,
    [ViewMode.List]: ListView,
  };

  // @ts-ignore
  const LinkComponent = linkView[viewMode];

  return collection ? (
    <div
      className="h-96"
      style={{
        backgroundImage: `linear-gradient(${collection?.color}30 10%, ${
          settings.theme === "dark" ? "#262626" : "#f3f4f6"
        } 13rem, ${settings.theme === "dark" ? "#171717" : "#ffffff"} 100%)`,
      }}
    >
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
      <div className="lg:w-3/4 w-full mx-auto p-5 bg">
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
                title="Created with Linkwarden"
                className="h-8 w-fit mx-auto rounded"
              />
            </Link>
          </div>
        </div>

        <div className="mt-3">
          <div className={`min-w-[15rem]`}>
            <div className="flex gap-1 justify-center sm:justify-end items-center w-fit">
              <div
                className="flex items-center btn px-2 btn-ghost rounded-full"
                onClick={() => setEditCollectionSharingModal(true)}
              >
                {collectionOwner.id ? (
                  <ProfilePhoto
                    src={collectionOwner.image || undefined}
                    name={collectionOwner.name}
                  />
                ) : undefined}
                {collection.members
                  .sort((a, b) => (a.userId as number) - (b.userId as number))
                  .map((e, i) => {
                    return (
                      <ProfilePhoto
                        key={i}
                        src={e.user.image ? e.user.image : undefined}
                        className="-ml-3"
                        name={e.user.name}
                      />
                    );
                  })
                  .slice(0, 3)}
                {collection.members.length - 3 > 0 ? (
                  <div className={`avatar drop-shadow-md placeholder -ml-3`}>
                    <div className="bg-base-100 text-neutral rounded-full w-8 h-8 ring-2 ring-neutral-content">
                      <span>+{collection.members.length - 3}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <p className="text-neutral text-sm font-semibold">
                By {collectionOwner.name}
                {collection.members.length > 0
                  ? ` and ${collection.members.length} others`
                  : undefined}
                .
              </p>
            </div>
          </div>
        </div>

        <p className="mt-5">{collection.description}</p>

        <div className="divider mt-5 mb-0"></div>

        <div className="flex mb-5 mt-10 flex-col gap-5">
          <div className="flex justify-between gap-3">
            <SearchBar
              placeholder={`Search ${collection._count?.links} Links`}
            />

            <div className="flex gap-2 items-center w-fit">
              <FilterSearchDropdown
                searchFilter={searchFilter}
                setSearchFilter={setSearchFilter}
              />

              <SortDropdown sortBy={sortBy} setSort={setSortBy} />

              <ViewDropdown viewMode={viewMode} setViewMode={setViewMode} />
            </div>
          </div>

          {links[0] ? (
            <LinkComponent
              links={links
                .filter((e) => e.collectionId === Number(router.query.id))
                .map((e, i) => {
                  const linkWithCollectionData = {
                    ...e,
                    collection: collection, // Append collection data
                  };
                  return linkWithCollectionData;
                })}
            />
          ) : (
            <p>This collection is empty...</p>
          )}

          {/* <p className="text-center text-neutral">
        List created with <span className="text-black">Linkwarden.</span>
        </p> */}
        </div>
      </div>
      {editCollectionSharingModal ? (
        <EditCollectionSharingModal
          onClose={() => setEditCollectionSharingModal(false)}
          activeCollection={collection}
        />
      ) : undefined}
    </div>
  ) : (
    <></>
  );
}
