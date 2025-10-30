import MainLayout from "@/layouts/MainLayout";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import React from "react";
import { toast } from "react-hot-toast";
import DashboardItem from "@/components/DashboardItem";
import NewLinkModal from "@/components/ModalContent/NewLinkModal";
import PageHeader from "@/components/PageHeader";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import { useCollections } from "@linkwarden/router/collections";
import { useTags } from "@linkwarden/router/tags";
import { useDashboardData } from "@linkwarden/router/dashboardData";
import { useUpdateUser, useUser } from "@linkwarden/router/user";
import SurveyModal from "@/components/ModalContent/SurveyModal";
import ImportDropdown from "@/components/ImportDropdown";
import { Button } from "@/components/ui/button";
import DashboardLayoutDropdown from "@/components/DashboardLayoutDropdown";
import {
  DashboardSection,
  DashboardSectionType,
} from "@linkwarden/prisma/client";
import { DashboardLinks } from "@/components/DashboardLinks";
import {
  LinkIncludingShortenedCollectionAndTags,
  ViewMode,
} from "@linkwarden/types";
import ViewDropdown from "@/components/ViewDropdown";
import clsx from "clsx";
import Icon from "@/components/Icon";
import { DragEndEvent } from "@dnd-kit/core";
import Droppable from "@/components/Droppable";
import { useUpdateLink } from "@linkwarden/router/links";
import usePinLink from "@/lib/client/pinLink";
import { useQueryClient } from "@tanstack/react-query";
import DragNDrop from "@/components/DragNDrop";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: collections = [] } = useCollections();
  const {
    data: { links = [], numberOfPinnedLinks, collectionLinks = {} } = {
      links: [],
    },
    ...dashboardData
  } = useDashboardData();

  /**
   * Get a combined list of all links, including those from collections.
   * Dupplications are fine since this is used for finding dragged link
   */
  const allLinks = useMemo(() => {
    const _collectionLinks = Object.values(collectionLinks).flat();
    return [...links, ..._collectionLinks];
  }, [collectionLinks, links]);

  const { data: tags = [] } = useTags();
  const { data: user } = useUser();
  const pinLink = usePinLink();
  const queryClient = useQueryClient();

  const [numberOfLinks, setNumberOfLinks] = useState(0);
  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);

  const [dashboardSections, setDashboardSections] = useState<
    DashboardSection[]
  >(user?.dashboardSections || []);

  useEffect(() => {
    setDashboardSections(user?.dashboardSections || []);
  }, [user?.dashboardSections]);

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );

  useEffect(() => {
    setNumberOfLinks(
      collections.reduce(
        (accumulator, collection) =>
          accumulator + (collection._count as any).links,
        0
      )
    );
  }, [collections]);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_STRIPE === "true" &&
      user &&
      user.id &&
      user.referredBy === null &&
      // if user is using Linkwarden for more than 3 days
      new Date().getTime() - new Date(user.createdAt).getTime() >
        3 * 24 * 60 * 60 * 1000
    ) {
      setTimeout(() => {
        setShowsSurveyModal(true);
      }, 1000);
    }
  }, [user]);

  const orderedSections = useMemo(() => {
    return [...dashboardSections].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }, [dashboardSections]);

  const [newLinkModal, setNewLinkModal] = useState(false);

  const [showSurveyModal, setShowsSurveyModal] = useState(false);

  const updateUser = useUpdateUser();
  const updateLink = useUpdateLink();

  const [submitLoader, setSubmitLoader] = useState(false);

  // Function to render the dragged item
  const submitSurvey = async (referer: string, other?: string) => {
    if (submitLoader) return;

    setSubmitLoader(true);

    const load = toast.loading(t("applying"));

    await updateUser.mutateAsync(
      {
        ...user,
        referredBy: referer === "other" ? "Other: " + other : referer,
      },
      {
        onSettled: (data, error) => {
          console.log(data, error);
          setSubmitLoader(false);
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            toast.success(t("thanks_for_feedback"));
            setShowsSurveyModal(false);
          }
        },
      }
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over, active } = event;
    if (!over || !activeLink) return;

    const targetSectionId = over.id as string;
    const collectionId = over.data.current?.id as number;
    const collectionName = over.data.current?.name as string;
    const ownerId = over.data.current?.ownerId as number;

    const isFromRecentSection = active.data.current?.dashboardType === "recent";

    // Immediately hide the drag overlay
    setActiveLink(null);
    if (over.data.current?.type === "tag") {
      const isTagAlreadyExists = activeLink.tags.some(
        (tag) => tag.name === over.data.current?.name
      );
      if (isTagAlreadyExists) {
        toast.error(t("tag_already_added"));
        return;
      }
      // to match the tags structure required to update the link
      const allTags: { name: string }[] = activeLink.tags.map((tag) => ({
        name: tag.name,
      }));
      const newTags = [...allTags, { name: over.data.current?.name as string }];
      const updatedLink = {
        ...activeLink,
        tags: newTags as any,
      };
      const load = toast.loading(t("updating"));
      await updateLink.mutateAsync(updatedLink, {
        onSettled: (_, error) => {
          toast.dismiss(load);
          if (error) {
            // If there's an error, invalidate queries to restore the original state
            queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
            toast.error(error.message);
          } else {
            toast.success(t("updated"));
          }
        },
      });
      return;
    }

    // Handle pinning the link
    if (targetSectionId === "pinned-links-section") {
      if (Array.isArray(activeLink.pinnedBy) && !activeLink.pinnedBy.length) {
        // optimistically update the link's pinned state
        const updatedLink = {
          ...activeLink,
          pinnedBy: [user?.id],
        };
        queryClient.setQueryData(["dashboardData"], (oldData: any) => {
          if (!oldData?.links) return oldData;
          return {
            ...oldData,
            links: oldData.links.map((link: any) =>
              link.id === updatedLink.id ? updatedLink : link
            ),
          };
        });
        pinLink(activeLink);
      }
      // Handle moving the link to a different collection
    } else if (activeLink.collection.id !== collectionId) {
      // Optimistically update the link's collection immediately
      const updatedLink: LinkIncludingShortenedCollectionAndTags = {
        ...activeLink,
        collection: {
          id: collectionId,
          name: collectionName,
          ownerId,
        },
      };

      // Optimistically update the dashboard data cache
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData?.links) return oldData;
        return {
          ...oldData,
          links: oldData.links.map((link: any) =>
            link.id === updatedLink.id ? updatedLink : link
          ),
        };
      });

      // Optimistically update the collection links cache
      if (collectionId) {
        queryClient.setQueryData(["dashboardData"], (oldData: any) => {
          if (!oldData?.collectionLinks) return oldData;

          const oldCollectionId = activeLink.collection.id!;

          return {
            ...oldData,
            collectionLinks: {
              ...oldData.collectionLinks,
              // Remove from old collection
              [oldCollectionId]: (
                oldData.collectionLinks[oldCollectionId] || []
              ).filter((link: any) => link.id !== updatedLink.id),
              // Add to new collection
              [collectionId]: [
                ...(oldData.collectionLinks[collectionId] || []),
                updatedLink,
              ],
            },
          };
        });
      }

      const load = toast.loading(t("updating"));
      await updateLink.mutateAsync(updatedLink, {
        onSettled: (_, error) => {
          toast.dismiss(load);
          if (error) {
            // If there's an error, invalidate queries to restore the original state
            queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
            toast.error(error.message);
          } else {
            toast.success(t("updated"));
          }
        },
      });
    } else if (isFromRecentSection) {
      // show error if link is dragged from recent section to the target collection which it already belongs to
      toast.error(t("link_already_in_collection"));
    }
  };

  return (
    <DragNDrop
      onDragEnd={handleDragEnd}
      links={allLinks}
      activeLink={activeLink}
      setActiveLink={setActiveLink}
    >
      <MainLayout>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <i className="bi-house-fill text-primary" aria-hidden="true" />
              <h1 className="font-thin">{t("dashboard")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <DashboardLayoutDropdown />
              <ViewDropdown
                viewMode={viewMode}
                setViewMode={setViewMode}
                dashboard
              />
            </div>
          </div>
          {orderedSections[0] ? (
            orderedSections?.map((section, i) => (
              <Section
                key={i}
                sectionData={section}
                t={t}
                collection={collections.find(
                  (c) => c.id === section.collectionId
                )}
                collectionLinks={
                  section.collectionId
                    ? collectionLinks[section.collectionId]
                    : []
                }
                links={links}
                tags={tags}
                numberOfLinks={numberOfLinks}
                collectionsLength={collections.length}
                numberOfPinnedLinks={numberOfPinnedLinks}
                dashboardData={dashboardData}
                setNewLinkModal={setNewLinkModal}
              />
            ))
          ) : (
            <div className="h-full flex flex-col gap-4">
              <div className="xl:flex flex flex-col sm:grid grid-cols-2 gap-4 xl:flex-row xl:justify-evenly xl:w-full">
                <div className="skeleton h-20 w-full"></div>
                <div className="skeleton h-20 w-full"></div>
                <div className="skeleton h-20 w-full"></div>
                <div className="skeleton h-20 w-full"></div>
              </div>
              <div className="skeleton h-full"></div>
              <div className="skeleton h-full"></div>
              <div className="skeleton h-full"></div>
            </div>
          )}
        </div>

        {showSurveyModal && (
          <SurveyModal
            submit={submitSurvey}
            onClose={() => {
              setShowsSurveyModal(false);
            }}
          />
        )}
        {newLinkModal && (
          <NewLinkModal onClose={() => setNewLinkModal(false)} />
        )}
      </MainLayout>
    </DragNDrop>
  );
}

export { getServerSideProps };

type SectionProps = {
  sectionData: DashboardSection;
  t: (key: string) => string;
  collection: any;
  collectionsLength: number;
  links: any[];
  tags: any[];
  numberOfLinks: number;
  numberOfPinnedLinks: number;
  dashboardData: any;
  collectionLinks: any[];
  setNewLinkModal: (value: boolean) => void;
};

const Section = ({
  sectionData,
  t,
  collection,
  links,
  tags,
  numberOfLinks,
  collectionsLength,
  numberOfPinnedLinks,
  dashboardData,
  collectionLinks,
  setNewLinkModal,
}: SectionProps) => {
  switch (sectionData.type) {
    case DashboardSectionType.STATS:
      return (
        <section className="xl:flex flex flex-col sm:grid grid-cols-2 gap-4 xl:flex-row xl:justify-evenly xl:w-full">
          <h2 className="sr-only">{t("statistics")}</h2>
          <DashboardItem
            name={numberOfLinks === 1 ? t("link") : t("links")}
            value={numberOfLinks}
            icon={"bi-link-45deg"}
          />

          <DashboardItem
            name={collectionsLength === 1 ? t("collection") : t("collections")}
            value={collectionsLength}
            icon={"bi-folder"}
          />

          <DashboardItem
            name={tags.length === 1 ? t("tag") : t("tags")}
            value={tags.length}
            icon={"bi-hash"}
          />

          <DashboardItem
            name={t("pinned")}
            value={numberOfPinnedLinks}
            icon={"bi-pin-angle"}
          />
        </section>
      );
    case DashboardSectionType.RECENT_LINKS:
      return (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <PageHeader icon={"bi-clock-history"} title={t("recent_links")} />
            </div>
            <Link
              href="/links"
              className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
            >
              {t("view_all")}
              <i className="bi-chevron-right text-sm"></i>
            </Link>
          </div>

          {dashboardData.isLoading ||
          (links && links[0] && !dashboardData.isLoading) ? (
            <DashboardLinks
              type="recent"
              links={links}
              isLoading={dashboardData.isLoading}
            />
          ) : (
            <div className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-xl bg-base-200 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200">
              <p className="text-center text-xl">
                {t("view_added_links_here")}
              </p>
              <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm mt-2">
                {t("view_added_links_here_desc")}
              </p>

              <div className="text-center w-full mt-4 flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => {
                    setNewLinkModal(true);
                  }}
                  variant="accent"
                >
                  <i className="bi-plus-lg text-xl"></i>
                  {t("add_link")}
                </Button>

                <ImportDropdown />
              </div>
            </div>
          )}
        </section>
      );
    case DashboardSectionType.PINNED_LINKS:
      return (
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <PageHeader icon={"bi-pin-angle"} title={t("pinned_links")} />
            </div>
            <Link
              href="/links/pinned"
              className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
            >
              {t("view_all")}
              <i className="bi-chevron-right text-sm "></i>
            </Link>
          </div>
          <Droppable
            id="pinned-links-section"
            data={{
              name: "pinned-links",
            }}
          >
            {dashboardData.isLoading ||
            links?.some((e: any) => e.pinnedBy && e.pinnedBy[0]) ? (
              <DashboardLinks
                links={links.filter((e: any) => e.pinnedBy && e.pinnedBy[0])}
                isLoading={dashboardData.isLoading}
              />
            ) : (
              <div className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-xl bg-base-200 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200">
                <i className="bi-pin mx-auto text-6xl text-primary"></i>
                <p className="text-center text-xl">
                  {t("pin_favorite_links_here")}
                </p>
                <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
                  {t("pin_favorite_links_here_desc")}
                </p>
              </div>
            )}
          </Droppable>
        </section>
      );
    case DashboardSectionType.COLLECTION:
      return (
        collection?.id && (
          <section className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div className={clsx("flex items-center gap-3")}>
                  {collection.icon ? (
                    <Icon
                      icon={collection.icon}
                      color={collection.color || "#0ea5e9"}
                      className="text-2xl"
                    />
                  ) : (
                    <i
                      className={`bi-folder-fill text-primary text-2xl drop-shadow`}
                      style={{ color: collection.color || "#0ea5e9" }}
                    ></i>
                  )}
                  <div>
                    <h3 className="text-2xl capitalize font-thin">
                      {collection.name}
                    </h3>
                  </div>
                </div>
              </div>
              <Link
                href={`/collections/${collection.id}`}
                className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer whitespace-nowrap"
              >
                {t("view_all")}
                <i className="bi-chevron-right text-sm"></i>
              </Link>
            </div>
            <Droppable
              id={`dashboard-${collection.id}`}
              data={{
                id: collection.id,
                name: collection.name,
                ownerId: collection.ownerId,
                type: "collection",
              }}
            >
              {dashboardData.isLoading || collectionLinks?.length > 0 ? (
                <DashboardLinks
                  type="collection"
                  links={collectionLinks}
                  isLoading={dashboardData.isLoading}
                />
              ) : (
                <div className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-xl bg-base-200 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200 min-h-72">
                  <i className="bi-folder mx-auto text-6xl text-primary"></i>
                  <p className="text-center text-xl">
                    {t("no_link_in_collection")}
                  </p>
                  <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
                    {t("no_link_in_collection_desc")}
                  </p>
                </div>
              )}
            </Droppable>
          </section>
        )
      );
    default:
      return null;
  }
};
