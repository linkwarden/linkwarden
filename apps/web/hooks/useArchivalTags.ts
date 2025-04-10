import { Tag } from "@prisma/client";
import {
  ArchivalOptionKeys,
  ArchivalTagOption,
} from "../components/InputSelect/types";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import isArchivalTag from "@/lib/shared/isArchivalTag";

const useArchivalTags = (initialTags: Tag[]) => {
  const [archivalTags, setArchivalTags] = useState<ArchivalTagOption[]>([]);
  const [options, setOptions] = useState<ArchivalTagOption[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (!initialTags) return;

    const transformTag = (tag: Tag): ArchivalTagOption => ({
      label: tag.name,
      archiveAsScreenshot: tag.archiveAsScreenshot || false,
      archiveAsMonolith: tag.archiveAsMonolith || false,
      archiveAsPDF: tag.archiveAsPDF || false,
      archiveAsReadable: tag.archiveAsReadable || false,
      archiveAsWaybackMachine: tag.archiveAsWaybackMachine || false,
      aiTag: tag.aiTag || false,
    });

    const archival = initialTags.filter(isArchivalTag).map(transformTag);
    const nonArchival = initialTags
      .filter((tag) => !isArchivalTag(tag))
      .map(transformTag);

    setArchivalTags(archival);
    setOptions(nonArchival);
  }, [initialTags]);

  const addTags = (newTags: ArchivalTagOption[]) => {
    const newTag = newTags.map(({ value, ...tag }) => {
      // Check if a tag with the same label already exists
      const existingTag = archivalTags.find(
        (archiveTag) => archiveTag.label === tag.label
      );

      // If it exists, return the existing tag with archive values set to false
      if (existingTag) {
        return {
          ...existingTag,
          archiveAsScreenshot: false,
          archiveAsMonolith: false,
          archiveAsPDF: false,
          archiveAsReadable: false,
          archiveAsWaybackMachine: false,
          aiTag: false,
        };
      }

      // If it doesn't exist, create a new tag with default values
      return {
        ...tag,
        archiveAsScreenshot: false,
        archiveAsMonolith: false,
        archiveAsPDF: false,
        archiveAsReadable: false,
        archiveAsWaybackMachine: false,
        aiTag: false,
      };
    });

    // Filter out any existing tags with matching labels before adding new ones
    setArchivalTags((prev) => {
      const filteredPrev = prev.filter(
        (prevTag) => !newTags.some(({ label }) => label === prevTag.label)
      );
      return [...filteredPrev, ...newTag];
    });

    setOptions((prev) =>
      prev.filter(
        (option) => !newTags.some(({ label }) => label === option.label)
      )
    );
  };

  const toggleOption = (
    tag: ArchivalTagOption,
    option: keyof ArchivalTagOption
  ) => {
    setArchivalTags((prev) =>
      prev.map((t) =>
        t.label === tag.label ? { ...t, [option]: !t[option] } : t
      )
    );
  };

  const removeTag = (tagToDelete: ArchivalTagOption) => {
    if (!tagToDelete.__isNew__) {
      // Set all the values to null so we can delete the archive settings from the database
      setArchivalTags((prev) =>
        prev.map((t) =>
          t.label === tagToDelete.label
            ? {
                ...t,
                archiveAsScreenshot: null,
                archiveAsMonolith: null,
                archiveAsPDF: null,
                archiveAsReadable: null,
                archiveAsWaybackMachine: null,
                aiTag: null,
              }
            : t
        )
      );

      const resetTag: ArchivalTagOption = {
        ...tagToDelete,
        archiveAsScreenshot: false,
        archiveAsMonolith: false,
        archiveAsPDF: false,
        archiveAsReadable: false,
        archiveAsWaybackMachine: false,
        aiTag: false,
      };

      setOptions((prev) => {
        if (!prev.some((t) => t.label === resetTag.label)) {
          return [...prev, resetTag];
        }
        return prev;
      });
    } else {
      setArchivalTags((prev) =>
        prev.filter((t) => t.label !== tagToDelete.label)
      );
    }
  };

  const ARCHIVAL_OPTIONS: {
    type: ArchivalOptionKeys;
    icon: string;
    label: string;
  }[] = [
    { type: "aiTag", icon: "bi-tag", label: t("ai_tagging") },
    {
      type: "archiveAsScreenshot",
      icon: "bi-file-earmark-image",
      label: t("screenshot"),
    },
    {
      type: "archiveAsMonolith",
      icon: "bi-filetype-html",
      label: t("webpage"),
    },
    { type: "archiveAsPDF", icon: "bi-file-earmark-pdf", label: t("pdf") },
    {
      type: "archiveAsReadable",
      icon: "bi-file-earmark-text",
      label: t("readable"),
    },
    {
      type: "archiveAsWaybackMachine",
      icon: "bi-archive",
      label: t("archive_org_snapshot"),
    },
  ];

  return {
    ARCHIVAL_OPTIONS,
    archivalTags,
    options,
    addTags,
    toggleOption,
    removeTag,
  };
};

export { useArchivalTags };
