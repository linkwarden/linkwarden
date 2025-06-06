import React from "react";
import Drawer from "./Drawer";
import { useGetLinkHighlights } from "@linkwarden/router/highlights";
import { useRouter } from "next/router";
import clsx from "clsx";
import Link from "next/link";
import { useTranslation } from "next-i18next";

type Props = {
  onClose: Function;
};

const HighlightDrawer = ({ onClose }: Props) => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data } = useGetLinkHighlights(Number(router.query.id));

  return (
    <Drawer
      toggleDrawer={onClose}
      className="sm:h-screen items-center relative"
      direction="left"
    >
      <div>
        <h2 className="text-lg font-semibold mb-5">{t("notes_highlights")}</h2>
        {data && data.length > 0 ? (
          data.map((highlight) => {
            const formattedDate = new Date(highlight.createdAt).toLocaleString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );

            return (
              <Link key={highlight.id} href={`#highlight-${highlight.id}`}>
                <div
                  className={clsx(
                    "p-2 mb-4 border-l-2 duration-150 cursor-pointer",
                    highlight.color === "yellow"
                      ? "border-yellow-500"
                      : highlight.color === "green"
                        ? "border-green-500"
                        : highlight.color === "blue"
                          ? "border-blue-500"
                          : "border-red-500"
                  )}
                >
                  <p
                    className={clsx(
                      "w-fit px-2 rounded-md",
                      highlight.color === "yellow"
                        ? "bg-yellow-600"
                        : highlight.color === "green"
                          ? "bg-green-500"
                          : highlight.color === "blue"
                            ? "bg-blue-500"
                            : "bg-red-500"
                    )}
                  >
                    {highlight.text}
                  </p>
                  <span
                    className="text-xs text-neutral"
                    title={String(highlight.createdAt)}
                  >
                    {formattedDate}
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-neutral text-sm">{t("no_notes_highlights")}</div>
        )}
      </div>
    </Drawer>
  );
};

export default HighlightDrawer;
