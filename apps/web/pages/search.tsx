import { useLinks, useUpdateLink } from "@linkwarden/router/links";
import MainLayout from "@/layouts/MainLayout";
import {
  LinkIncludingShortenedCollectionAndTags,
  Sort,
  ViewMode,
} from "@linkwarden/types";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import LinkListOptions from "@/components/LinkListOptions";
import getServerSideProps from "@/lib/client/getServerSideProps";
import { useTranslation } from "next-i18next";
import Links from "@/components/LinkViews/Links";
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
import toast from "react-hot-toast";
import { customCollisionDetectionAlgorithm } from "@/lib/utils";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import LinkIcon from "@/components/LinkViews/LinkComponents/LinkIcon";

export default function Search() {
  const { t } = useTranslation();

  const router = useRouter();

  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem("viewMode") as ViewMode) || ViewMode.Card
  );

  const [sortBy, setSortBy] = useState<Sort>(
    Number(localStorage.getItem("sortBy")) ?? Sort.DateNewestFirst
  );

  const [editMode, setEditMode] = useState(false);
  const [activeLink, setActiveLink] =
    useState<LinkIncludingShortenedCollectionAndTags | null>(null);

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

  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    if (editMode) return setEditMode(false);
  }, [router]);

  const { links, data } = useLinks({
    sort: sortBy,
    searchQueryString: decodeURIComponent(router.query.q as string),
  });
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

    // if the link dropped over the same collection, toast
    if (activeLink.collection.id === collectionId) {
      toast.error(t("link_already_in_collection"));
      return;
    }

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
        {!!activeLink && (
          <DragOverlay className="z-50 pointer-events-none">
            <div className="w-fit h-fit">
              <LinkIcon link={activeLink} />
            </div>
          </DragOverlay>
        )}
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
            <PageHeader icon={"bi-search"} title={t("search_results")} />
          </LinkListOptions>

          {!data.isLoading && links && !links[0] && <p>{t("nothing_found")}</p>}
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
