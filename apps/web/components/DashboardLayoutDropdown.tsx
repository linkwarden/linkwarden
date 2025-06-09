import React, { useState, useMemo, DragEvent, useEffect } from "react";
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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<
    "above" | "below" | null
  >(null);

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

    updateDashboardLayout.mutateAsync(updatedSections);
  };

  const handleReorder = (sourceId: string, destId: string) => {
    if (sourceId === destId) return;
    const sourceIndex = filteredSections.findIndex(
      (s) => getSectionId(s) === sourceId
    );
    const destIndex = filteredSections.findIndex(
      (s) => getSectionId(s) === destId
    );
    if (sourceIndex < 0 || destIndex < 0) return;

    const reordered = [...filteredSections];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(destIndex, 0, moved);

    const updated = reordered.map((section, idx) =>
      section.enabled ? { ...section, order: idx } : section
    );

    updateDashboardLayout.mutateAsync(updated);
  };

  return (
    <DropdownMenu modal>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <i className="bi-sliders2-vertical text-neutral" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-72 pt-1 px-0 pb-0" align="end">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col gap-1 mx-2">
            <p className="text-sm text-neutral">{t("display_on_dashboard")}</p>

            <TextInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-0"
              placeholder={t("search")}
            />
          </div>

          <ul className="max-h-60 overflow-y-auto px-2 pb-2">
            {filteredSections.map((section) => (
              <DraggableListItem
                key={getSectionId(section)}
                section={section}
                onCheckboxChange={handleCheckboxChange}
                onReorder={handleReorder}
                draggedId={draggedId}
                dragOverId={dragOverId}
                dragOverPosition={dragOverPosition}
                setDraggedId={setDraggedId}
                setDragOverId={setDragOverId}
                setDragOverPosition={setDragOverPosition}
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
  onReorder: (sourceId: string, destId: string) => void;
  draggedId: string | null;
  dragOverId: string | null;
  dragOverPosition: "above" | "below" | null;
  setDraggedId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
  setDragOverPosition: (pos: "above" | "below" | null) => void;
}

function DraggableListItem({
  section,
  onCheckboxChange,
  onReorder,
  draggedId,
  dragOverId,
  dragOverPosition,
  setDraggedId,
  setDragOverId,
  setDragOverPosition,
}: DraggableListItemProps) {
  const sectionId = `${section.type}-${section.collectionId ?? "default"}`;

  const handleDragStart = (e: DragEvent<HTMLLIElement>) => {
    const img = new Image();
    img.src =
      "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg'/%3e";
    e.dataTransfer.setDragImage(img, 0, 0);

    e.dataTransfer.setData("text/plain", sectionId);
    setDraggedId(sectionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "above" : "below";
    setDragOverPosition(pos);
    setDragOverId(sectionId);
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    setDragOverId(null);
    setDragOverPosition(null);
  };

  const handleDrop = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId) {
      const destId = dragOverPosition === "below" ? sectionId : sectionId;
      onReorder(sourceId, destId);
    }
    setDraggedId(null);
    setDragOverId(null);
    setDragOverPosition(null);
  };

  const indicatorClass =
    dragOverId === sectionId && dragOverPosition === "above"
      ? "border-t-2 border-primary"
      : dragOverId === sectionId && dragOverPosition === "below"
        ? "border-b-2 border-primary"
        : "";

  return (
    <li
      draggable={section.enabled}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={() => {
        setDraggedId(null);
        setDragOverId(null);
        setDragOverPosition(null);
      }}
      className={`
        py-1 px-2 flex items-center justify-between
        ${section.enabled ? "cursor-grab active:cursor-grabbing" : ""}
        ${draggedId === sectionId ? "opacity-70" : ""}
        ${indicatorClass}
      `}
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
          className="text-sm select-none"
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
