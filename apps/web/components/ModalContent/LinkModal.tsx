import React, { useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types";
import { useTranslation } from "next-i18next";
import { useDeleteLink } from "@linkwarden/router/links";
import Drawer from "../Drawer";
import LinkDetails from "../LinkDetails";
import Link from "next/link";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  onClose: Function;
  onDelete: Function;
  onUpdateArchive: Function;
  onPin: Function;
  link: LinkIncludingShortenedCollectionAndTags;
  activeMode?: "view" | "edit";
};

export default function LinkModal({
  onClose,
  onDelete,
  onUpdateArchive,
  onPin,
  link,
  activeMode,
}: Props) {
  const { t } = useTranslation();

  const permissions = usePermissions(link.collection.id as number);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const deleteLink = useDeleteLink();

  const [mode, setMode] = useState<"view" | "edit">(activeMode || "view");

  const handleDelete = async (e: React.MouseEvent) => {
    setTimeout(() => (document.body.style.pointerEvents = ""), 0);

    if (e.shiftKey && link.id) {
      const loading = toast.loading(t("deleting"));
      await deleteLink.mutateAsync(link.id, {
        onSettled: (data, error) => {
          toast.dismiss(loading);
          error ? toast.error(error.message) : toast.success(t("deleted"));
        },
      });
      onClose();
    } else {
      onDelete();
      onClose();
    }
  };

  return (
    <Drawer
      toggleDrawer={onClose}
      className="sm:h-screen items-center relative"
    >
      <div className="absolute top-3 left-0 right-0 flex justify-between px-3">
        <Button
          variant="simple"
          size="icon"
          className="bi-x text-xl rounded-full text-base-content opacity-50 hover:opacity-100 z-10"
          onClick={() => onClose()}
        ></Button>

        {(permissions === true || permissions?.canUpdate) && !isPublicRoute && (
          <Tabs
            value={(mode === "view" ? "view" : "edit").toString()}
            className="w-fit absolute left-1/2 -translate-x-1/2 rounded-full bg-base-100/50 text-sm shadow-md z-10 opacity-90"
            onValueChange={(index: any) =>
              setMode(index === "view" ? "view" : "edit")
            }
          >
            <TabsList className="rounded-full h-8">
              <TabsTrigger value="view" className="rounded-full py-0">
                View
              </TabsTrigger>
              <TabsTrigger value="edit" className="rounded-full py-0">
                Edit
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <div className="flex gap-2">
          {!isPublicRoute && (
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="simple"
                  size="icon"
                  className="rounded-full text-base-content opacity-50 hover:opacity-100 z-10"
                  title={t("more")}
                >
                  <i title="More" className="bi-three-dots text-xl" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="bg-base-200 border border-neutral-content rounded-box p-1"
              >
                <DropdownMenuItem
                  onClick={() => {
                    (document.activeElement as HTMLElement)?.blur();
                    onPin();
                  }}
                >
                  <i className="bi-pin" />
                  {link.pinnedBy?.[0] ? t("unpin") : t("pin_to_dashboard")}
                </DropdownMenuItem>

                {link.type === "url" &&
                  (permissions === true || permissions?.canUpdate) && (
                    <DropdownMenuItem
                      onClick={() => {
                        (document.activeElement as HTMLElement)?.blur();
                        onUpdateArchive();
                      }}
                    >
                      <i className="bi-arrow-clockwise"></i>
                      {t("refresh_preserved_formats")}
                    </DropdownMenuItem>
                  )}

                {(permissions === true || permissions?.canDelete) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-error"
                    >
                      <i className="bi-trash"></i>
                      {t("delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {link.url && (
            <Button
              asChild
              variant="simple"
              size="icon"
              className="rounded-full"
            >
              <Link
                href={link.url}
                target="_blank"
                className="bi-box-arrow-up-right text-base-content opacity-50 hover:opacity-100 select-none z-10"
              ></Link>
            </Button>
          )}
        </div>
      </div>

      <div className="w-full">
        <LinkDetails
          activeLink={link}
          className="sm:mt-0 -mt-11"
          mode={mode}
          setMode={(mode: "view" | "edit") => setMode(mode)}
          onUpdateArchive={onUpdateArchive}
        />
      </div>
    </Drawer>
  );
}
