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
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";

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
  const [isDraggedOver, setIsDraggedOver] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const dashboardSections: DashboardSection[] = user?.dashboardSections || [];

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
    [user]
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
    [collections, user]
  );

  const allSections = useMemo(
    () => [...defaultSections, ...collectionSections],
    [collectionSections, defaultSections]
  );

  const filteredSections = useMemo(() => {
    let sections = allSections;

    // Filter by search term
    if (searchTerm.trim()) {
      sections = sections.filter((section) =>
        section.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Separate and sort sections
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
    `${section.type}-${section.collectionId || "default"}`;

  // Set up drag and drop
  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceId = source.data?.sectionId as string;
        const destinationId = destination.data?.sectionId as string;

        if (!sourceId || !destinationId || sourceId === destinationId) return;

        const sourceIndex = filteredSections.findIndex(
          (s) => getSectionId(s) === sourceId
        );
        const destinationIndex = filteredSections.findIndex(
          (s) => getSectionId(s) === destinationId
        );

        if (sourceIndex === -1 || destinationIndex === -1) return;

        // Only allow reordering within enabled sections
        const sourceSection = filteredSections[sourceIndex];
        const destinationSection = filteredSections[destinationIndex];

        if (!sourceSection.enabled || !destinationSection.enabled) return;

        const reorderedSections = reorder({
          list: filteredSections,
          startIndex: sourceIndex,
          finishIndex: destinationIndex,
        });

        // Update orders for enabled sections only
        const updatedSections = reorderedSections.map((section, index) => {
          if (section.enabled) {
            return { ...section, order: index };
          }
          return section;
        });

        console.log("Reordered sections:", updatedSections);

        updateDashboardLayout.mutateAsync(updatedSections);
      },
    });
  }, [filteredSections, updateDashboardLayout]);

  const handleCheckboxChange = (section: DashboardSectionOption) => {
    const updatedSections = allSections.map((s) => {
      if (s.type === section.type && s.collectionId === section.collectionId) {
        return {
          ...s,
          enabled: !s.enabled,
        };
      }
      return s;
    });

    updateDashboardLayout.mutateAsync(updatedSections);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <i className="bi-sliders2-vertical text-neutral" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-72 py-2" align="end">
        <div className="px-1 flex flex-col gap-1">
          <p className="text-sm text-neutral">{t("display_on_dashboard")}</p>

          <TextInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="py-0"
            placeholder={t("search")}
          />

          <ul className="max-h-60 overflow-y-auto">
            {filteredSections.map((section) => (
              <DraggableListItem
                key={getSectionId(section)}
                section={section}
                onCheckboxChange={handleCheckboxChange}
                isDraggedOver={isDraggedOver === getSectionId(section)}
                isDragged={draggedItem === getSectionId(section)}
                setIsDraggedOver={setIsDraggedOver}
                setDraggedItem={setDraggedItem}
              />
            ))}

            {filteredSections.length === 0 && (
              <li className="text-sm py-2 text-center text-neutral">
                {t("no_results_found")}
              </li>
            )}
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DraggableListItemProps {
  section: DashboardSectionOption;
  onCheckboxChange: (section: DashboardSectionOption) => void;
  isDraggedOver: boolean;
  isDragged: boolean;
  setIsDraggedOver: (id: string | null) => void;
  setDraggedItem: (id: string | null) => void;
}

function DraggableListItem({
  section,
  onCheckboxChange,
  isDraggedOver,
  isDragged,
  setIsDraggedOver,
  setDraggedItem,
}: DraggableListItemProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const sectionId = `${section.type}-${section.collectionId || "default"}`;

  useEffect(() => {
    const el = element;
    if (!el || !section.enabled) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({ sectionId }),
        onDragStart: () => setDraggedItem(sectionId),
        onDrop: () => setDraggedItem(null),
      }),
      dropTargetForElements({
        element: el,
        getData: () => ({ sectionId }),
        onDragEnter: () => setIsDraggedOver(sectionId),
        onDragLeave: () => setIsDraggedOver(null),
        onDrop: () => setIsDraggedOver(null),
      })
    );
  }, [element, section.enabled, sectionId, setDraggedItem, setIsDraggedOver]);

  return (
    <li
      ref={setElement}
      data-section-id={sectionId}
      className={`
        py-1 px-2 flex items-center justify-between cursor-pointer rounded
        ${section.enabled ? "cursor-grab active:cursor-grabbing" : ""}
        ${isDragged ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center gap-2">
        <input
          id={`section-${section.type}-${section.collectionId || "default"}`}
          className="checkbox checkbox-primary"
          type="checkbox"
          checked={section.enabled}
          onChange={() => onCheckboxChange(section)}
        />
        <label
          htmlFor={`section-${section.type}-${
            section.collectionId || "default"
          }`}
          className="text-sm cursor-pointer"
        >
          {section.name}
        </label>
      </div>

      <i
        className={`bi-grip-vertical text-neutral ${
          section.enabled ? "cursor-grab" : "opacity-50"
        }`}
      />
    </li>
  );
}
