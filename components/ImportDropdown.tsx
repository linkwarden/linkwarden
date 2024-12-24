import React from "react";
import importBookmarks from "@/lib/client/importBookmarks";
import { MigrationFormat } from "@/types/global";
import { useTranslation } from "next-i18next";
import { dropdownTriggerer } from "@/lib/client/utils";

type Props = {};
const ImportDropdown = ({}: Props) => {
  const { t } = useTranslation();
  return (
    <div className="dropdown dropdown-bottom">
      <div
        tabIndex={0}
        role="button"
        onMouseDown={dropdownTriggerer}
        className="inline-flex items-center gap-2 text-sm btn bg-neutral-content text-secondary-foreground hover:bg-neutral-content/80 border border-neutral/30 hover:border hover:border-neutral/30"
        id="import-dropdown"
      >
        <i className="bi-cloud-upload text-xl duration-100"></i>
        <p>{t("import_links")}</p>
      </div>
      <ul className="shadow menu dropdown-content z-[1] bg-base-200 border border-neutral-content rounded-box mt-1">
        <li>
          <label
            tabIndex={0}
            role="button"
            htmlFor="import-linkwarden-file"
            title={t("from_linkwarden")}
            className="whitespace-nowrap"
          >
            {t("from_linkwarden")}
            <input
              type="file"
              name="photo"
              id="import-linkwarden-file"
              accept=".json"
              className="hidden"
              onChange={(e) => importBookmarks(e, MigrationFormat.linkwarden)}
            />
          </label>
        </li>
        <li>
          <label
            tabIndex={0}
            role="button"
            htmlFor="import-html-file"
            title={t("from_html")}
            className="whitespace-nowrap"
          >
            {t("from_html")}
            <input
              type="file"
              name="photo"
              id="import-html-file"
              accept=".html"
              className="hidden"
              onChange={(e) => importBookmarks(e, MigrationFormat.htmlFile)}
            />
          </label>
        </li>
        <li>
          <label
            tabIndex={0}
            role="button"
            htmlFor="import-wallabag-file"
            title={t("from_wallabag")}
            className="whitespace-nowrap"
          >
            {t("from_wallabag")}
            <input
              type="file"
              name="photo"
              id="import-wallabag-file"
              accept=".json"
              className="hidden"
              onChange={(e) => importBookmarks(e, MigrationFormat.wallabag)}
            />
          </label>
        </li>
        <li>
          <label
            tabIndex={0}
            role="button"
            htmlFor="import-omnivore-file"
            title={t("from_omnivore")}
            className="whitespace-nowrap"
          >
            {t("from_omnivore")}
            <input
              type="file"
              name="photo"
              id="import-omnivore-file"
              accept=".zip"
              className="hidden"
              onChange={(e) => importBookmarks(e, MigrationFormat.omnivore)}
            />
          </label>
        </li>
      </ul>
    </div>
  );
};

export default ImportDropdown;
