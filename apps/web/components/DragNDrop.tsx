import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  SensorDescriptor,
  SensorOptions,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import LinkIcon from "./LinkViews/LinkComponents/LinkIcon";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import toast from "react-hot-toast";
import { useUpdateLink } from "@linkwarden/router/links";
import { useTranslation } from "react-i18next";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { customCollisionDetectionAlgorithm } from "@/lib/utils";
import usePinLink from "@/lib/client/pinLink";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@linkwarden/router/user";

interface DragNDropProps {
  children: React.ReactNode;
  /**
   * The currently active link being dragged
   */
  activeLink: LinkIncludingShortenedCollectionAndTags | null;
  /**
   * All links available for drag and drop
   */
  setActiveLink: (link: LinkIncludingShortenedCollectionAndTags | null) => void;
  /**
   * Override the default sensors used for drag and drop.
   */
  sensors?: SensorDescriptor<SensorOptions>[];

  /**
   * Override onDragEnd function.
   */
  onDragEnd?: (event: DragEndEvent) => void;
}

/**
 * Wrapper component for drag and drop functionality.
 */
export default function DragNDrop({
  children,
  activeLink,
  setActiveLink,
  sensors: sensorProp,
  onDragEnd: onDragEndProp,
}: DragNDropProps) {
  const { t } = useTranslation();
  const updateLink = useUpdateLink();
  const pinLink = usePinLink();
  const { data: user } = useUser();
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLink(
      (event.active.data.current
        ?.link as LinkIncludingShortenedCollectionAndTags) ?? null
    );
  };

  const handleDragOverCancel = () => {
    setActiveLink(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (onDragEndProp) {
      onDragEndProp(event);
      return;
    }

    const { over, active } = event;
    if (!over || !activeLink) return;

    const overData = over.data.current;
    const targetId = String(over.id);

    const isFromRecentSection = active.data.current?.dashboardType === "recent";

    setActiveLink(null);

    const mutateWithToast = async (
      updatedLink: LinkIncludingShortenedCollectionAndTags,
      opts?: { invalidateDashboardOnError?: boolean }
    ) => {
      const load = toast.loading(t("updating"));
      await updateLink.mutateAsync(updatedLink, {
        onSettled: async (_, error) => {
          toast.dismiss(load);
          if (error) {
            if (
              opts?.invalidateDashboardOnError &&
              typeof queryClient !== "undefined"
            ) {
              await queryClient.invalidateQueries({
                queryKey: ["dashboardData"],
              });
            }
            toast.error(error.message);
          } else {
            toast.success(t("updated"));
          }
        },
      });
    };

    // DROP ON TAG
    if (overData?.type === "tag") {
      const tagName = overData?.name as string | undefined;
      if (!tagName) return;

      const isTagAlreadyExists = activeLink.tags?.some(
        (tag) => tag.name === tagName
      );
      if (isTagAlreadyExists) {
        toast.error(t("tag_already_added"));
        return;
      }

      const allTags: { name: string }[] = (activeLink.tags ?? []).map(
        (tag) => ({
          name: tag.name,
        })
      );

      const updatedLink: LinkIncludingShortenedCollectionAndTags = {
        ...activeLink,
        tags: [...allTags, { name: tagName }] as any,
      };

      await mutateWithToast(updatedLink, {
        invalidateDashboardOnError: typeof queryClient !== "undefined",
      });
      return;
    }

    // DROP ON DASHBOARD "PINNED" SECTION
    const isPinnedSection = targetId === "pinned-links-section";

    const canPin =
      typeof pinLink === "function" &&
      typeof user !== "undefined" &&
      typeof user?.id !== "undefined";

    if (isPinnedSection && canPin) {
      if (Array.isArray(activeLink.pinnedBy) && !activeLink.pinnedBy.length) {
        if (typeof queryClient !== "undefined") {
          const optimisticallyPinned = {
            ...activeLink,
            pinnedBy: [user!.id],
          };

          queryClient.setQueryData(["dashboardData"], (oldData: any) => {
            if (!oldData?.links) return oldData;
            return {
              ...oldData,
              links: oldData.links.map((l: any) =>
                l.id === optimisticallyPinned.id ? optimisticallyPinned : l
              ),
            };
          });
        }

        pinLink(activeLink);
      }
      return;
    }

    // DROP ON COLLECTION (dashboard + sidebar)
    const collectionId = overData?.id as number | undefined;
    const collectionName = overData?.name as string | undefined;
    const ownerId = overData?.ownerId as number | undefined;

    if (!collectionId || !collectionName || typeof ownerId === "undefined")
      return;

    const isSameCollection = activeLink.collection?.id === collectionId;
    if (isSameCollection) {
      if (isFromRecentSection) toast.error(t("link_already_in_collection"));
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

    if (typeof queryClient !== "undefined") {
      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData?.links) return oldData;
        return {
          ...oldData,
          links: oldData.links.map((l: any) =>
            l.id === updatedLink.id ? updatedLink : l
          ),
        };
      });

      queryClient.setQueryData(["dashboardData"], (oldData: any) => {
        if (!oldData?.collectionLinks) return oldData;

        const oldCollectionId = activeLink.collection?.id;
        if (!oldCollectionId) return oldData;

        return {
          ...oldData,
          collectionLinks: {
            ...oldData.collectionLinks,
            [oldCollectionId]: (
              oldData.collectionLinks[oldCollectionId] || []
            ).filter((l: any) => l.id !== updatedLink.id),
            [collectionId]: [
              ...(oldData.collectionLinks[collectionId] || []),
              updatedLink,
            ],
          },
        };
      });
    }

    await mutateWithToast(updatedLink, {
      invalidateDashboardOnError: typeof queryClient !== "undefined",
    });
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragOverCancel}
      modifiers={[snapCenterToCursor]}
      sensors={sensorProp ? sensorProp : sensors}
      collisionDetection={customCollisionDetectionAlgorithm}
    >
      {!!activeLink && (
        // when drag end, immediately hide the overlay
        <DragOverlay
          style={{
            zIndex: 100,
            pointerEvents: "none",
          }}
        >
          <div className="w-fit h-fit">
            <LinkIcon link={activeLink} />
          </div>
        </DragOverlay>
      )}
      {children}
    </DndContext>
  );
}
