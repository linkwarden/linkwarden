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
import { restrictToWindowEdges, snapCenterToCursor } from "@dnd-kit/modifiers";
import { customCollisionDetectionAlgorithm } from "@/lib/utils";

interface DragNDropProps {
  children: React.ReactNode;
  /**
   * The currently active link being dragged
   */
  activeLink: LinkIncludingShortenedCollectionAndTags | null;
  /**
   * All links available for drag and drop
   */
  links: LinkIncludingShortenedCollectionAndTags[];
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
  links,
  setActiveLink,
  sensors: sensorProp,
  onDragEnd: onDragEndProp,
}: DragNDropProps) {
  const { t } = useTranslation();
  const updateLink = useUpdateLink();
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
    const draggedLink = links.find(
      (link: any) => link.id === event.active.data.current?.linkId
    );
    setActiveLink(draggedLink || null);
  };

  const handleDragOverCancel = () => {
    setActiveLink(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    // If an onDragEnd prop is provided, use it instead of the default behavior
    if (onDragEndProp) {
      onDragEndProp(event);
      return;
    }
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
      modifiers={[restrictToWindowEdges, snapCenterToCursor]}
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
