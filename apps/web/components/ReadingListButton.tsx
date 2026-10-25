import clsx from "clsx";
import { useTranslation } from "next-i18next";
import { useReadingListStatus } from "@linkwarden/router/readingList";
import useSetReadingListStatus from "@/lib/client/readingList";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ReadingListButton({ linkId }: { linkId: number }) {
  const { t } = useTranslation();
  const status = useReadingListStatus(linkId);
  const setReadingListStatus = useSetReadingListStatus();

  const label =
    status === "unread"
      ? t("mark_as_read")
      : status === "read"
        ? t("mark_as_unread")
        : t("add_to_reading_list");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={() =>
              setReadingListStatus(
                [linkId],
                status === "unread" ? "read" : "unread"
              )
            }
          >
            <i
              className={clsx(
                "text-xl text-neutral",
                status === "unread"
                  ? "bi-bookmark-check"
                  : status === "read"
                    ? "bi-bookmark-check-fill"
                    : "bi-bookmark-plus"
              )}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
