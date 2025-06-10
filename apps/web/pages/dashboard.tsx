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
import useLocalSettingsStore from "@/store/localSettings";
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
  const [showRecentLinks, setShowRecentLinks] = useState(false);
  const [showPinnedLinks, setShowPinnedLinks] = useState(false);

  const [dashboardSections, setDashboardSections] = useState<
    DashboardSection[]
  >(user?.dashboardSections || []);

  useEffect(() => {
    setDashboardSections(user?.dashboardSections || []);
  }, [user?.dashboardSections]);

  const { settings } = useLocalSettingsStore();

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

  useEffect(() => {
    const recentLinks = dashboardSections.some(
      (section) => section.type === "RECENT_LINKS"
    );
    const pinnedLinks = dashboardSections.some(
      (section) => section.type === "PINNED_LINKS"
    );

    setShowRecentLinks(recentLinks || false);
    setShowPinnedLinks(pinnedLinks || false);
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

  const renderStatsSection = () => (
    <div className="xl:flex flex flex-col sm:grid grid-cols-2 gap-3 xl:flex-row xl:justify-evenly xl:w-full">
      <DashboardItem
        name={numberOfLinks === 1 ? t("link") : t("links")}
        value={numberOfLinks}
        icon={"bi-link-45deg"}
      />

      <DashboardItem
        name={collections.length === 1 ? t("collection") : t("collections")}
        value={collections.length}
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

  const renderRecentLinksSection = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <PageHeader
            icon={"bi-clock-history"}
            title={t("recent")}
            description={t("recent_links_desc")}
          />
        </div>
        <Link
          href="/links"
          className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
        >
          {t("view_all")}
          <i className="bi-chevron-right text-sm"></i>
        </Link>
      </div>

      <div
        style={{
          flex: links || dashboardData.isLoading ? "0 1 auto" : "1 1 auto",
        }}
        className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
      >
        {dashboardData.isLoading ||
        (links && links[0] && !dashboardData.isLoading) ? (
          <DashboardLinks links={links} isLoading={dashboardData.isLoading} />
        ) : (
          <div className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-xl bg-base-200 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200">
            <p className="text-center text-xl">{t("view_added_links_here")}</p>
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
      </div>
    </>
  );

  const renderPinnedLinksSection = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 items-center">
          <PageHeader
            icon={"bi-pin-angle"}
            title={t("pinned")}
            description={t("pinned_links_desc")}
          />
        </div>
        <Link
          href="/links/pinned"
          className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
        >
          {t("view_all")}
          <i className="bi-chevron-right text-sm "></i>
        </Link>
      </div>

      <div
        style={{ flex: "1 1 auto" }}
        className="flex flex-col 2xl:flex-row items-start 2xl:gap-2"
      >
        {dashboardData.isLoading ||
        links?.some((e: any) => e.pinnedBy && e.pinnedBy[0]) ? (
          <DashboardLinks
            links={links.filter((e: any) => e.pinnedBy && e.pinnedBy[0])}
            isLoading={dashboardData.isLoading}
          />
        ) : (
          <div
            style={{ flex: "1 1 auto" }}
            className="flex flex-col gap-2 justify-center h-full border border-solid border-neutral-content w-full mx-auto p-10 rounded-xl bg-base-200 bg-gradient-to-tr from-neutral-content/70 to-50% to-base-200"
          >
            <i className="bi-pin mx-auto text-6xl text-primary"></i>
            <p className="text-center text-xl">
              {t("pin_favorite_links_here")}
            </p>
            <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
              {t("pin_favorite_links_here_desc")}
            </p>
          </div>
        )}
      </div>
    </>
  );

  const renderCollectionSection = (section: DashboardSection) => {
    const collection = collections.find((c) => c.id === section.collectionId);
    if (!collection) return null;

    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2 items-center">
            <PageHeader
              icon={"bi-folder"}
              title={collection.name}
              description={`${collection._count?.links || 0} ${t("links")}`}
            />
          </div>
          <Link
            href={`/collections/${collection.id}`}
            className="flex items-center text-sm text-black/75 dark:text-white/75 gap-2 cursor-pointer"
          >
            {t("view_all")}
            <i className="bi-chevron-right text-sm"></i>
          </Link>
        </div>

        <div className="flex flex-col 2xl:flex-row items-start 2xl:gap-2">
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
                {t("no_links_in_collection")}
              </p>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderSection = (section: DashboardSection) => {
    switch (section.type) {
      case DashboardSectionType.STATS:
        return renderStatsSection();
      case DashboardSectionType.RECENT_LINKS:
        return renderRecentLinksSection();
      case DashboardSectionType.PINNED_LINKS:
        return renderPinnedLinksSection();
      case DashboardSectionType.COLLECTION:
        return renderCollectionSection(section);
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div style={{ flex: "1 1 auto" }} className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <PageHeader
            icon={"bi-house "}
            title={t("dashboard")}
            description={t("dashboard_desc")}
          />
          <div className="flex items-center gap-3">
            <DashboardLayoutDropdown />
          </div>
        </div>

        {orderedSections?.map((section) => (
          <div key={`${section.type}-${section.collectionId || "default"}`}>
            {renderSection(section)}
          </div>
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
