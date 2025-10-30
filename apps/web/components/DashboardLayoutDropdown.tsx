import React, { useState, useMemo, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import TextInput from "./TextInput";
import { useCollections } from "@linkwarden/router/collections";
import {
  DashboardSection,
  DashboardSectionType,
} from "@linkwarden/prisma/client";
import { useUser } from "@linkwarden/router/user";
import { useUpdateDashboardLayout } from "@linkwarden/router/dashboardData";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { cn } from "@linkwarden/lib";
import toast from "react-hot-toast";

interface DashboardSectionOption {
  type: DashboardSectionType;
  name: string;
  collectionId?: number;
  enabled: boolean;
  order?: number;
}

export default function DashboardLayoutDropdown() {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const { data: collections = [] } = useCollections();
  const updateDashboardLayout = useUpdateDashboardLayout();
  const [searchTerm, setSearchTerm] = useState("");
  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 200ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const [dashboardSections, setDashboardSections] = useState<
    DashboardSection[]
  >(user?.dashboardSections || []);

  useEffect(() => {
    setDashboardSections(user?.dashboardSections || []);
  }, [user?.dashboardSections]);

  const getSectionOrder = (
    type: DashboardSectionType,
    collectionId?: number
  ): number | undefined => {
    const section = dashboardSections.find(
      (section) =>
        section.type === type &&
        (type === DashboardSectionType.COLLECTION
          ? section.collectionId === collectionId
          : true)
    );
    return section?.order;
  };

  const isSectionEnabled = (
    type: DashboardSectionType,
    collectionId?: number
  ): boolean => {
    return dashboardSections.some(
      (section) =>
        section.type === type &&
        (type === DashboardSectionType.COLLECTION
          ? section.collectionId === collectionId
          : true)
    );
  };

  const defaultSections: DashboardSectionOption[] = useMemo(
    () => [
      {
        type: DashboardSectionType.STATS,
        name: t("dashboard_stats"),
        enabled: isSectionEnabled(DashboardSectionType.STATS),
        order: getSectionOrder(DashboardSectionType.STATS),
      },
      {
        type: DashboardSectionType.RECENT_LINKS,
        name: t("recent_links"),
        enabled: isSectionEnabled(DashboardSectionType.RECENT_LINKS),
        order: getSectionOrder(DashboardSectionType.RECENT_LINKS),
      },
      {
        type: DashboardSectionType.PINNED_LINKS,
        name: t("pinned_links"),
        enabled: isSectionEnabled(DashboardSectionType.PINNED_LINKS),
        order: getSectionOrder(DashboardSectionType.PINNED_LINKS),
      },
    ],
    [dashboardSections]
  );

  const collectionSections = useMemo(
    () =>
      collections.map((collection) => ({
        type: DashboardSectionType.COLLECTION,
        name: collection.name,
        collectionId: collection.id,
        enabled: isSectionEnabled(
          DashboardSectionType.COLLECTION,
          collection.id
        ),
        order: getSectionOrder(DashboardSectionType.COLLECTION, collection.id),
      })),
    [collections, dashboardSections]
  );

  const allSections = useMemo(
    () => [...defaultSections, ...collectionSections],
    [collectionSections, defaultSections]
  );

  const filteredSections = useMemo(() => {
    let sections = allSections;

    if (searchTerm.trim()) {
      sections = sections.filter((section) =>
        section.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const enabledSections = sections
      .filter((section) => section.enabled)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });

    const disabledSections = sections.filter((section) => !section.enabled);

    return [...enabledSections, ...disabledSections];
  }, [allSections, searchTerm]);

  const getSectionId = (section: DashboardSectionOption) =>
    `${section.type}-${section.collectionId ?? "default"}`;

  const handleCheckboxChange = (section: DashboardSectionOption) => {
    const enabledSections = allSections.filter((s) => s.enabled);
    const highestOrder =
      enabledSections.length > 0
        ? Math.max(...enabledSections.map((s) => s.order ?? 0))
        : -1;

    const updatedSections = allSections.map((s) => {
      if (s.type === section.type && s.collectionId === section.collectionId) {
        return {
          ...s,
          enabled: !s.enabled,
          order: !s.enabled ? highestOrder + 1 : undefined,
        };
      }
      return s;
    });

    updateDashboardLayout.mutateAsync(updatedSections, {
      onSettled: (data, error) => {
        if (error) {
          toast.error(error.message);
        }
      },
    });
  };

  const handleReorder = (sourceId: string, destId: string) => {
    if (sourceId === destId) return;

    // Get only enabled sections for reordering
    const enabledSections = filteredSections.filter((s) => s.enabled);

    const sourceIndex = enabledSections.findIndex(
      (s) => getSectionId(s) === sourceId
    );
    const destIndex = enabledSections.findIndex(
      (s) => getSectionId(s) === destId
    );
    if (sourceIndex < 0 || destIndex < 0) return;

    // Reorder only the enabled sections
    const reorderedEnabled = [...enabledSections];
    const [moved] = reorderedEnabled.splice(sourceIndex, 1);
    reorderedEnabled.splice(destIndex, 0, moved);

    // Assign new order values based on the reordered enabled sections
    const reorderedWithNewOrders = reorderedEnabled.map((section, idx) => ({
      ...section,
      order: idx,
    }));

    // Get disabled sections and combine with reordered enabled sections
    const disabledSections = filteredSections.filter((s) => !s.enabled);
    const updated = [...reorderedWithNewOrders, ...disabledSections];

    updateDashboardLayout.mutateAsync(updated, {
      onSettled: (data, error) => {
        if (error) {
          toast.error(error.message);
        }
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const sourceId = active.id as string;
    const destId = over.id as string;

    // Only allow reordering enabled sections
    const sourceSection = filteredSections.find(
      (s) => getSectionId(s) === sourceId
    );
    const destSection = filteredSections.find(
      (s) => getSectionId(s) === destId
    );
    if (sourceSection?.enabled && destSection?.enabled) {
      handleReorder(sourceId, destId);
    }
  };

  // Only include enabled sections in the sortable context
  const sortableItems = filteredSections
    .filter((section) => section.enabled)
    .map(getSectionId);

  return (
    <DropdownMenu modal>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
          <i className="bi-sliders2-vertical text-neutral" />
          {t("edit_layout")}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-72 pt-1 px-0 pb-0 select-none"
        align="end"
      >
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1 mx-2">
            <p className="text-sm text-neutral mb-1">
              {t("display_on_dashboard")}
            </p>

            <TextInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-0 bg-base-100"
              placeholder={t("search")}
            />
          </div>
          <DndContext
            modifiers={[restrictToParentElement]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={sortableItems}
              strategy={verticalListSortingStrategy}
            >
              <ul className="max-h-60 overflow-y-auto px-2 pb-2">
                {filteredSections.map((section) => {
                  const color =
                    section.type === "COLLECTION"
                      ? collections.find((c) => c.id === section.collectionId)
                          ?.color
                      : undefined;

                  return (
                    <DraggableListItem
                      key={getSectionId(section)}
                      section={{ ...section, color }}
                      onCheckboxChange={handleCheckboxChange}
                    />
                  );
                })}

                {filteredSections.length === 0 && (
                  <li className="text-sm py-2 text-center text-neutral">
                    {t("no_results_found")}
                  </li>
                )}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DraggableListItemProps {
  section: DashboardSectionOption & { color?: string };
  onCheckboxChange: (section: DashboardSectionOption) => void;
}

function DraggableListItem({
  section,
  onCheckboxChange,
}: DraggableListItemProps) {
  const sectionId = `${section.type}-${section.collectionId ?? "default"}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sectionId,
    disabled: !section.enabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "select-none py-1 px-1 flex items-center justify-between",
        section.enabled
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-default",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center gap-2">
        <input
          id={`section-${section.type}-${section.collectionId ?? "default"}`}
          className="checkbox checkbox-primary"
          type="checkbox"
          checked={section.enabled}
          onChange={() => onCheckboxChange(section)}
        />
        <label
          htmlFor={`section-${section.type}-${
            section.collectionId ?? "default"
          }`}
          className={`text-sm pointer-events-none ${
            section.enabled ? "opacity-100" : "opacity-50"
          }`}
        >
          <i
            className={`bi-${
              section.type === "STATS"
                ? "bar-chart-line"
                : section.type === "RECENT_LINKS"
                  ? "clock"
                  : section.type === "PINNED_LINKS"
                    ? "pin"
                    : "folder-fill"
            } ${section.type !== "COLLECTION" ? "text-primary" : ""} mr-1`}
            style={
              section.type === "COLLECTION" ? { color: section.color } : {}
            }
          />
          {section.name}
        </label>
      </div>

      <i
        className={`bi-grip-vertical text-neutral ${
          section.enabled ? "opacity-100" : "opacity-50"
        }`}
      />
    </li>
  );
}
