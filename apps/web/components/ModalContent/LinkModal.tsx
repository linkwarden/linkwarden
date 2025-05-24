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
import Tab from "../Tab";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
        <div
          className="bi-x text-xl btn btn-sm btn-circle text-base-content opacity-50 hover:opacity-100 z-10"
          onClick={() => onClose()}
        ></div>

        {(permissions === true || permissions?.canUpdate) && !isPublicRoute && (
          <Tab
            tabs={[
              { name: "View" },
              {
                name: "Edit",
              },
            ].map((tab) => ({
              name: tab.name,
            }))}
            activeTabIndex={mode === "view" ? 0 : 1}
            setActiveTabIndex={(index: any) =>
              setMode(index === 0 ? "view" : "edit")
            }
            className="w-fit absolute left-1/2 -translate-x-1/2 rounded-full bg-base-100/50 text-sm shadow-md z-10"
          />
        )}

        <div className="flex gap-2">
          {!isPublicRoute && (
            <DropdownMenu modal={true}>
              <DropdownMenuTrigger asChild>
                <button
                  className="btn btn-sm btn-circle text-base-content opacity-50 hover:opacity-100 z-10"
                  title={t("more")}
                >
                  <i title="More" className="bi-three-dots text-xl" />
                </button>
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
            <Link
              href={link.url}
              target="_blank"
              className="bi-box-arrow-up-right btn-circle text-base-content opacity-50 hover:opacity-100 btn btn-sm select-none z-10"
            ></Link>
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
