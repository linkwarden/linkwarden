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
import { ViewMode } from "@linkwarden/types";
import ViewDropdown from "@/components/ViewDropdown";
import clsx from "clsx";
import Icon from "@/components/Icon";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: collections = [] } = useCollections();
  const {
    data: { links = [], numberOfPinnedLinks } = { links: [] },
    ...dashboardData
  } = useDashboardData();
  const { data: tags = [] } = useTags();
  const { data: user } = useUser();

  const [numberOfLinks, setNumberOfLinks] = useState(0);

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

  // Sort sections by order and filter enabled ones
  const orderedSections = useMemo(() => {
    return dashboardSections.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return 0;
    });
  }, [dashboardSections]);

  const [newLinkModal, setNewLinkModal] = useState(false);

  const [showSurveyModal, setShowsSurveyModal] = useState(false);

  const updateUser = useUpdateUser();

  const [submitLoader, setSubmitLoader] = useState(false);

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

  return (
    <MainLayout>
      <div className="p-5 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="bi-house-fill text-primary" />
            <p className="font-thin">{t("dashboard")}</p>
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
        {orderedSections?.map((section, i) => (
          <Section
            key={i}
            sectionData={section}
            t={t}
            collection={collections.find((c) => c.id === section.collectionId)}
            links={links}
            tags={tags}
            numberOfLinks={numberOfLinks}
            collectionsLength={collections.length}
            numberOfPinnedLinks={numberOfPinnedLinks}
            dashboardData={dashboardData}
            setNewLinkModal={setNewLinkModal}
          />
        ))}
      </div>

      {showSurveyModal && (
        <SurveyModal
          submit={submitSurvey}
          onClose={() => {
            setShowsSurveyModal(false);
          }}
        />
      )}
      {newLinkModal && <NewLinkModal onClose={() => setNewLinkModal(false)} />}
    </MainLayout>
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
  setNewLinkModal,
}: SectionProps) => {
  switch (sectionData.type) {
    case DashboardSectionType.STATS:
      return (
        <div className="xl:flex flex flex-col sm:grid grid-cols-2 gap-4 xl:flex-row xl:justify-evenly xl:w-full">
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
        </div>
      );
    case DashboardSectionType.RECENT_LINKS:
      return (
        <>
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
            <DashboardLinks links={links} isLoading={dashboardData.isLoading} />
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
        </>
      );
    case DashboardSectionType.PINNED_LINKS:
      return (
        <>
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
        </>
      );
    case DashboardSectionType.COLLECTION:
      return (
        <>
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
                  <p className="text-2xl capitalize font-thin">
                    {collection.name}
                  </p>
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

          {dashboardData.isLoading ||
          links?.filter((link: any) => link.collection.id === collection.id)
            .length > 0 ? (
            <DashboardLinks
              links={links.filter(
                (link: any) => link.collection.id === collection.id
              )}
              isLoading={dashboardData.isLoading}
            />
          ) : (
            <div className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-xl bg-base-200 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200">
              <i className="bi-folder mx-auto text-6xl text-primary"></i>
              <p className="text-center text-xl">
                {t("no_link_in_collection")}
              </p>
            </div>
          )}
        </>
      );
    default:
      return null;
  }
};
