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
import { DashboardSection, DashboardSectionType } from "@linkwarden/prisma/client";
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

  const dashboardSections: DashboardSection[] = user?.dashboardSections || [];

  const getSectionOrder = (type: DashboardSectionType, collectionId?: number): number | undefined => {
    const section = dashboardSections.find(section =>
      section.type === type &&
      (type === DashboardSectionType.COLLECTION ? section.collectionId === collectionId : true)
    );
    return section?.order;
  };

  const isSectionEnabled = (type: DashboardSectionType, collectionId?: number): boolean => {
    return dashboardSections.some(section =>
      section.type === type &&
      (type === DashboardSectionType.COLLECTION ? section.collectionId === collectionId : true)
    );
  };

  const defaultSections: DashboardSectionOption[] = useMemo(() => [
    {
      type: DashboardSectionType.STATS,
      name: t("dashboard_stats"),
      enabled: isSectionEnabled(DashboardSectionType.STATS),
      order: getSectionOrder(DashboardSectionType.STATS)
    },
    {
      type: DashboardSectionType.RECENT_LINKS,
      name: t("recent_links"),
      enabled: isSectionEnabled(DashboardSectionType.RECENT_LINKS),
      order: getSectionOrder(DashboardSectionType.RECENT_LINKS)
    },
    {
      type: DashboardSectionType.PINNED_LINKS,
      name: t("pinned_links"),
      enabled: isSectionEnabled(DashboardSectionType.PINNED_LINKS),
      order: getSectionOrder(DashboardSectionType.PINNED_LINKS)
    },
  ], [user]);

  const collectionSections = useMemo(() =>
    collections.map((collection) => ({
      type: DashboardSectionType.COLLECTION,
      name: collection.name,
      collectionId: collection.id,
      enabled: isSectionEnabled(DashboardSectionType.COLLECTION, collection.id),
      order: getSectionOrder(DashboardSectionType.COLLECTION, collection.id)
    })), [collections, user]
  );

  const allSections = useMemo(() => [...defaultSections, ...collectionSections], [
    collectionSections, defaultSections
  ]);

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
      .filter(section => section.enabled)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });

    const disabledSections = sections.filter(section => !section.enabled);

    return [...enabledSections, ...disabledSections];
  }, [allSections, searchTerm]);


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

    updateDashboardLayout.mutateAsync(updatedSections)
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
              <li
                key={section.type + (section.collectionId || 'default')}
                className="py-1 px-2 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <input
                    id={`section-${section.type}-${section.collectionId || 'default'}`}
                    className="checkbox checkbox-primary"
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => handleCheckboxChange(section)}
                  />
                  <label
                    htmlFor={`section-${section.type}-${section.collectionId || 'default'}`}
                    className="text-sm cursor-pointer"
                  >
                    {section.name}
                  </label>
                </div>

                <i className="bi-grip-vertical text-neutral" />
              </li>
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