import MainLayout from "@/layouts/MainLayout";
import React, { ReactElement, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { ReadingListStatus, Sort, ViewMode } from "@linkwarden/types/global";
import { useTranslation } from "next-i18next";
import getServerSideProps from "@/lib/client/getServerSideProps";
import LinkListOptions from "@/components/LinkListOptions";
import { useLinks } from "@linkwarden/router/links";
import Links from "@/components/LinkViews/Links";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NextPageWithLayout } from "../_app";

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );
  const [status, setStatus] = useState<ReadingListStatus>("unread");

  const { links, data } = useLinks({
    sort: sortBy,
    readingList: status,
  });

  const [editMode, setEditMode] = useState(false);

  return (
    <div className="p-3 flex flex-col gap-5 w-full h-full">
      <LinkListOptions
        t={t}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortBy={sortBy}
        setSortBy={setSortBy}
        editMode={editMode}
        setEditMode={setEditMode}
        links={links}
      >
        <PageHeader
          icon={"bi-bookmark"}
          title={t("reading_list")}
          description={t("reading_list_desc")}
        />
      </LinkListOptions>

      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as ReadingListStatus)}
      >
        <TabsList className="rounded-full h-8">
          <TabsTrigger value="unread" className="rounded-full py-0">
            {t("to_read")}
          </TabsTrigger>
          <TabsTrigger value="read" className="rounded-full py-0">
            {t("already_read")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {!data.isLoading && links && !links[0] && (
        <div
          style={{ flex: "1 1 auto" }}
          className="flex flex-col gap-2 justify-center h-full w-full mx-auto p-10"
        >
          <i
            className={`${
              status === "unread" ? "bi-bookmarks" : "bi-bookmark-check"
            } text-primary text-[7rem] leading-none mx-auto mb-5 drop-shadow`}
          />
          <p className="text-center text-xl">
            {status === "unread"
              ? t("reading_list_empty")
              : t("read_links_empty")}
          </p>
          <p className="text-center mx-auto max-w-96 w-fit text-neutral text-sm">
            {status === "unread"
              ? t("reading_list_empty_desc")
              : t("read_links_empty_desc")}
          </p>
        </div>
      )}
      <Links
        editMode={editMode}
        links={links}
        layout={viewMode}
        useData={data}
      />
    </div>
  );
};

Page.getLayout = function getLayout(page: ReactElement<any>) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;

export { getServerSideProps };
