import NoLinksFound from "@/components/NoLinksFound";
import { useLinks, useUpdateLink } from "@linkwarden/router/links";
import MainLayout from "@/layouts/MainLayout";
import React, { useEffect, useState } from "react";
import {
  LinkIncludingShortenedCollectionAndTags,
  Sort,
  ViewMode,
} from "@linkwarden/types";
import { useRouter } from "next/router";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import { toast } from "react-hot-toast";
import Links from "@/components/LinkViews/Links";
import clsx from "clsx";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import LinkCard from "@/components/LinkViews/LinkComponents/LinkCard";
import { customCollisionDetectionAlgorithm } from "@/lib/utils";
import { snapCenterToCursor } from "@dnd-kit/modifiers";

export default function Index() {
  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );
  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const { links, data } = useLinks({
    sort: sortBy,
  });

  const updateLink = useUpdateLink();
  const queryClient = useQueryClient();

  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });

  const renderDraggedItem = () => {
    if (!activeLink) return null;

    return (
      <div className="w-80 border border-solid border-neutral-content bg-base-200 rounded-xl shadow-lg relative">
        <span className="absolute z-50 top-3 left-2 w-8 h-8 p-1 rounded bg-base-100/80 inline-flex items-center justify-center">
          <i className="bi-grip-vertical text-xl" />
        </span>
        {viewMode === ViewMode.Card && (
          <LinkCard link={activeLink} columns={2} />
        )}
      </div>
    );
  };

  const sensors = useSensors(mouseSensor, touchSensor);

  const router = useRouter();

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedLink = links.find(
      (link: any) => link.id === event.active.data.current?.linkId
    );
    setActiveLink(draggedLink || null);
  };

  const handleDragOverCancel = () => {
    setActiveLink(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event;
    if (!over || !activeLink) return;

    const collectionId = over.data.current?.collectionId as number;
    const collectionName = over.data.current?.collectionName as string;
    const ownerId = over.data.current?.ownerId as number;

    // Immediately hide the drag overlay
    setActiveLink(null);

    // Handle moving the link to a different collection
    if (activeLink.collection.id !== collectionId) {
      const updatedLink: LinkIncludingShortenedCollectionAndTags = {
        ...activeLink,
        collection: {
          id: collectionId,
          name: collectionName,
          ownerId,
        },
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
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragOverCancel}
      sensors={sensors}
      collisionDetection={customCollisionDetectionAlgorithm}
      modifiers={[snapCenterToCursor]}
    >
      <MainLayout>
        <DragOverlay className="z-50 pointer-events-none">
          {renderDraggedItem()}
        </DragOverlay>
        <div className="p-5 flex flex-col gap-5 w-full h-full">
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
            <div className={clsx("flex items-center gap-3")}>
              <i
                className={`bi-link-45deg text-primary text-3xl drop-shadow`}
              ></i>
              <div>
                <p className="text-2xl capitalize font-thin">
                  {t("all_links")}
                </p>
                <p className="text-xs sm:text-sm">{t("all_links_desc")}</p>
              </div>
            </div>
          </LinkListOptions>

          {!data.isLoading && links && !links[0] && (
            <NoLinksFound text={t("you_have_not_added_any_links")} />
          )}
          <Links
            editMode={editMode}
            links={links}
            layout={viewMode}
            placeholderCount={1}
            useData={data}
          />
        </div>
      </MainLayout>
    </DndContext>
  );
}

export { getServerSideProps };
