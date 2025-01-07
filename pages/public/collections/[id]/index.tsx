"use client";
import getPublicCollectionData from "@/lib/client/getPublicCollectionData";
import {
  AccountSettings,
  CollectionIncludingMembersAndLinkCount,
  Sort,
  ViewMode,
} from "@/types/global";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import ProfilePhoto from "@/components/ProfilePhoto";
import ToggleDarkMode from "@/components/ToggleDarkMode";
import getPublicUserData from "@/lib/client/getPublicUserData";
import Image from "next/image";
import Link from "next/link";
import useLocalSettingsStore from "@/store/localSettings";
import SearchBar from "@/components/SearchBar";
import EditCollectionSharingModal from "@/components/ModalContent/EditCollectionSharingModal";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import LinkListOptions from "@/components/LinkListOptions";
import { usePublicLinks } from "@/hooks/store/publicLinks";
import Links from "@/components/LinkViews/Links";
import { usePublicTags } from "@/hooks/store/publicTags";

export default function PublicCollections() {
  const { t } = useTranslation();

  const { settings } = useLocalSettingsStore();

  const router = useRouter();

  const [collectionOwner, setCollectionOwner] = useState<
    Partial<AccountSettings>
  >({});

  const handleTagSelection = (tag: string | undefined) => {
    if (tag) {
      Object.keys(searchFilter).forEach(
        (v) =>
          (searchFilter[
            v as keyof {
              name: boolean;
              url: boolean;
              description: boolean;
              tags: boolean;
              textContent: boolean;
            }
          ] = false)
      );
      searchFilter.tags = true;
      return router.push(
        "/public/collections/" +
          router.query.id +
          "?q=" +
          encodeURIComponent(tag || "")
      );
    } else {
      return router.push("/public/collections/" + router.query.id);
    }
  };

  const [searchFilter, setSearchFilter] = useState({
    name: true,
    url: true,
    description: true,
    tags: true,
    textContent: false,
  });

  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const { data: tags } = usePublicTags();

  const { links, data } = usePublicLinks({
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
      getPublicCollectionData(Number(router.query.id)).then((res) => {
        if (res.status === 400) {
          router.push("/dashboard");
        } else {
          setCollection(res.response);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (collection) {
      getPublicUserData(collection.ownerId as number).then((owner) =>
        setCollectionOwner(owner)
      );
    }
  }, [collection]);

  const [editCollectionSharingModal, setEditCollectionSharingModal] =
    useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );

  if (!collection) return <></>;
  else
    return (
      <div
        className="h-96"
        style={{
          backgroundImage: `linear-gradient(${collection?.color}30 10%, ${
            settings.theme === "dark" ? "#262626" : "#f3f4f6"
          } 13rem, ${settings.theme === "dark" ? "#171717" : "#ffffff"} 100%)`,
        }}
      >
        {collection && (
          <Head>
            <title>{collection.name} | Linkwarden</title>
            <meta
              property="og:title"
              content={`${collection.name} | Linkwarden`}
              key="title"
            />
          </Head>
        )}
        <div className="lg:w-3/4 max-w-[1500px] w-full mx-auto p-5 bg">
          <div className="flex justify-between gap-2">
            <div className="w-full">
              <p className="text-4xl font-thin mb-2 capitalize mt-10">
                {collection.name}
              </p>

              <div className="mt-3">
                <div className={`min-w-[15rem]`}>
                  <div className="flex gap-1 justify-center sm:justify-end items-center w-fit">
                    <div
                      className="flex items-center btn px-2 btn-ghost rounded-full"
                      onClick={() => setEditCollectionSharingModal(true)}
                    >
                      {collectionOwner.id && (
                        <ProfilePhoto
                          src={collectionOwner.image || undefined}
                          name={collectionOwner.name}
                        />
                      )}
                      {collection.members
                        .sort(
                          (a, b) => (a.userId as number) - (b.userId as number)
                        )
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
                      {collection.members.length - 3 > 0 && (
                        <div
                          className={`avatar drop-shadow-md placeholder -ml-3`}
                        >
                          <div className="bg-base-100 text-neutral rounded-full w-8 h-8 ring-2 ring-neutral-content">
                            <span>+{collection.members.length - 3}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-neutral text-sm">
                      {collection.members.length > 0 &&
                      collection.members.length === 1
                        ? t("by_author_and_other", {
                            author: collectionOwner.name,
                            count: collection.members.length,
                          })
                        : collection.members.length > 0 &&
                            collection.members.length !== 1
                          ? t("by_author_and_others", {
                              author: collectionOwner.name,
                              count: collection.members.length,
                            })
                          : t("by_author", {
                              author: collectionOwner.name,
                            })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5">{collection.description}</p>
            </div>

            <div className="flex flex-col gap-2 items-center mt-10 min-w-fit">
              <div
                className="tooltip tooltip-left w-fit"
                data-tip={t("list_created_with_linkwarden")}
              >
                <Link href="https://linkwarden.app/" target="_blank">
                  <Image
                    src={`/icon.png`}
                    width={551}
                    height={551}
                    alt={t("linkwarden_icon")}
                    className="h-8 w-fit mx-auto rounded"
                  />
                </Link>
              </div>

              <ToggleDarkMode align="left" />

              <div className="tooltip tooltip-left" data-tip={t("rss_feed")}>
                <Link
                  href={`/public/collections/${collection.id}/rss`}
                  target="_blank"
                  className="text-neutral btn btn-ghost btn-sm size-8"
                >
                  <i className="bi bi-rss text-xl"></i>
                </Link>
              </div>
            </div>
          </div>

          <div className="divider mt-5 mb-0"></div>

          <div className="flex mb-5 mt-10 flex-col gap-5">
            <LinkListOptions
              t={t}
              viewMode={viewMode}
              setViewMode={setViewMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
            >
              <SearchBar
                placeholder={
                  collection._count?.links === 1
                    ? t("search_count_link", {
                        count: collection._count?.links,
                      })
                    : t("search_count_links", {
                        count: collection._count?.links,
                      })
                }
              />
            </LinkListOptions>
            {tags && tags[0] && (
              <div className="flex gap-2 mt-2 mb-6 flex-wrap">
                <button
                  className="max-w-full"
                  onClick={() => handleTagSelection(undefined)}
                >
                  <div
                    className={`${
                      !router.query.q
                        ? "bg-primary/20"
                        : "bg-neutral-content/20 hover:bg-neutral/20"
                    } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 rounded-md h-8`}
                  >
                    <p className="truncate px-3">{t("all_links")}</p>
                  </div>
                </button>
                {tags
                  .map((t) => t.name)
                  .filter((item, pos, self) => self.indexOf(item) === pos)
                  .sort((a, b) => a.localeCompare(b))
                  .map((e, i) => {
                    const active = router.query.q === e;
                    return (
                      <button
                        className="max-w-full"
                        key={i}
                        onClick={() => handleTagSelection(e)}
                      >
                        <div
                          className={`${
                            active
                              ? "bg-primary/20"
                              : "bg-neutral-content/20 hover:bg-neutral/20"
                          } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 rounded-md h-8`}
                        >
                          <i className="bi-hash text-2xl text-primary drop-shadow"></i>
                          <p className="truncate pr-3">{e}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            )}
            <Links
              links={
                links?.map((e, i) => {
                  const linkWithCollectionData = {
                    ...e,
                    collection: collection, // Append collection data
                  };
                  return linkWithCollectionData;
                }) as any
              }
              layout={viewMode}
              placeholderCount={1}
              useData={data}
            />
            {!data.isLoading && links && !links[0] && (
              <p>{t("nothing_found")}</p>
            )}

            {/* <p className="text-center text-neutral">
        List created with <span className="text-black">Linkwarden.</span>
        </p> */}
          </div>
        </div>
        {editCollectionSharingModal && (
          <EditCollectionSharingModal
            onClose={() => setEditCollectionSharingModal(false)}
            activeCollection={collection}
          />
        )}
      </div>
    );
}

export { getServerSideProps };
