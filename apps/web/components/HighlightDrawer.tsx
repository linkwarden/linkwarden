import React from "react";
import Drawer from "./Drawer";
import {
  useGetLinkHighlights,
  useRemoveHighlight,
} from "@linkwarden/router/highlights";
import { useRouter } from "next/router";
import clsx from "clsx";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

type Props = {
  onClose: Function;
};

const HighlightDrawer = ({ onClose }: Props) => {
  const router = useRouter();
  const { t } = useTranslation();

  const { data } = useGetLinkHighlights(Number(router.query.id));
  const removeHighlight = useRemoveHighlight(Number(router.query.id));

  return (
    <Drawer
      toggleDrawer={onClose}
      className="sm:h-screen items-center relative"
      direction="left"
    >
      <div>
        <h2 className="text-lg font-semibold">{t("notes_highlights")}</h2>
        <Separator className="my-5" />
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
                    "p-2 mb-4 border-l-2 duration-150 cursor-pointer flex flex-col gap-1 relative group",
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
                      "w-fit px-2 rounded-md mr-10",
                      highlight.color === "yellow"
                        ? "bg-yellow-500/70"
                        : highlight.color === "green"
                          ? "bg-green-500/70"
                          : highlight.color === "blue"
                            ? "bg-blue-500/70"
                            : "bg-red-500/70"
                    )}
                  >
                    {highlight.text}
                  </p>
                  {highlight.comment && <p>{highlight.comment}</p>}
                  <p
                    className="text-xs text-neutral"
                    title={String(highlight.createdAt)}
                  >
                    {formattedDate}
                  </p>

                  <Button
                    className="absolute top-2 right-2 text-neutral hover:text-red-500 group-hover:opacity-100 opacity-0 transition-opacity duration-150"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      removeHighlight.mutate(highlight.id);
                    }}
                  >
                    <i className="bi-trash" />
                  </Button>
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
