import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
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
import { useUpdateTag } from "@linkwarden/router/tags";

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
  const updateTag = useUpdateTag();
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

  const keyboardSensor = useSensor(KeyboardSensor, {
    // Restrict keyboard-initiated dragging to Space only (avoid Enter)
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape"],
      end: ["Space"],
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

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

    let updatedLink: LinkIncludingShortenedCollectionAndTags | null = null;

    // if the link is dropped over a tag
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
      updatedLink = {
        ...activeLink,
        tags: newTags as any,
      };
    } else {
      const collectionId = over.data.current?.id as number;
      const collectionName = over.data.current?.name as string;
      const ownerId = over.data.current?.ownerId as number;

      // Immediately hide the drag overlay
      setActiveLink(null);

      // if the link dropped over the same collection, toast
      if (activeLink.collection.id === collectionId) {
        toast.error(t("link_already_in_collection"));
        return;
      }

      updatedLink = {
        ...activeLink,
        collection: {
          id: collectionId,
          name: collectionName,
          ownerId,
        },
      };
    }

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
