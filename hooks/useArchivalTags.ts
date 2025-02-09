import { Tag } from "@prisma/client";
import {
  ArchivalOptionKeys,
  ArchivalTagOption,
} from "../components/InputSelect/types";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export const isArchivalTag = (tag: ArchivalTagOption | Tag) =>
  typeof tag.archiveAsScreenshot === "boolean" ||
  typeof tag.archiveAsMonolith === "boolean" ||
  typeof tag.archiveAsPDF === "boolean" ||
  typeof tag.archiveAsReadable === "boolean" ||
  typeof tag.archiveAsWaybackMachine === "boolean" ||
  typeof tag.aiTag === "boolean";

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
    const uniqueNewTags = newTags
      .filter(
        (newTag) =>
          !archivalTags.some((existing) => existing.label === newTag.label)
      )
      .map(({ __isNew__, value, ...tag }) => ({
        ...tag,
        archiveAsScreenshot: __isNew__ ? false : tag.archiveAsScreenshot,
        archiveAsMonolith: __isNew__ ? false : tag.archiveAsMonolith,
        archiveAsPDF: __isNew__ ? false : tag.archiveAsPDF,
        archiveAsReadable: __isNew__ ? false : tag.archiveAsReadable,
        archiveAsWaybackMachine: __isNew__
          ? false
          : tag.archiveAsWaybackMachine,
        aiTag: __isNew__ ? false : tag.aiTag,
      }));

    setArchivalTags((prev) => [...prev, ...uniqueNewTags]);
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

    if (!tagToDelete.__isNew__) {
      const resetTag: ArchivalTagOption = {
        ...tagToDelete,
        archiveAsScreenshot: false,
        archiveAsMonolith: false,
        archiveAsPDF: false,
        archiveAsReadable: false,
        archiveAsWaybackMachine: false,
        aiTag: false,
      };

      setOptions((prev) => [...prev, resetTag]);
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
