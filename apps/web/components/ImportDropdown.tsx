import React from "react";
import importBookmarks from "@/lib/client/importBookmarks";
import { MigrationFormat } from "@linkwarden/types";
import { useTranslation } from "next-i18next";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

type Props = {};

const ImportDropdown = ({}: Props) => {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="metal">
          <i className="bi-cloud-upload text-xl"></i>
          {t("import_links")}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="start">
        {[
          {
            id: "import-linkwarden-file",
            format: MigrationFormat.linkwarden,
            label: t("from_linkwarden"),
          },
          {
            id: "import-html-file",
            format: MigrationFormat.htmlFile,
            label: t("from_html"),
          },
          {
            id: "import-wallabag-file",
            format: MigrationFormat.wallabag,
            label: t("from_wallabag"),
          },
          {
            id: "import-omnivore-file",
            format: MigrationFormat.omnivore,
            label: t("from_omnivore"),
          },
        ].map((item) => (
          <DropdownMenuItem
            asChild
            key={item.id}
            onSelect={(e) => e.preventDefault()}
          >
            <label htmlFor={item.id} className="whitespace-nowrap w-full">
              {item.label}
              <input
                type="file"
                id={item.id}
                accept={
                  item.id === "import-html-file"
                    ? ".html"
                    : item.id === "import-omnivore-file"
                      ? ".zip"
                      : ".json"
                }
                className="hidden"
                onChange={(e) => importBookmarks(e, item.format)}
              />
            </label>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ImportDropdown;
