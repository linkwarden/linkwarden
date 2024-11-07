import React, { useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import { useTranslation } from "next-i18next";
import { useDeleteLink } from "@/hooks/store/links";
import Drawer from "../Drawer";
import LinkDetails from "../LinkDetails";
import Link from "next/link";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/router";
import { dropdownTriggerer } from "@/lib/client/utils";
import toast from "react-hot-toast";
import clsx from "clsx";

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
          <div className="flex gap-1 h-8 rounded-full bg-neutral-content bg-opacity-50 text-base-content p-1 text-xs duration-100 select-none z-10">
            <div
              className={clsx(
                "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold",
                mode === "view" && "bg-primary bg-opacity-50"
              )}
              onClick={() => {
                setMode("view");
              }}
            >
              View
            </div>
            <div
              className={clsx(
                "py-1 px-2 cursor-pointer duration-100 rounded-full font-semibold",
                mode === "edit" && "bg-primary bg-opacity-50"
              )}
              onClick={() => {
                setMode("edit");
              }}
            >
              Edit
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!isPublicRoute && (
            <div className={`dropdown dropdown-end z-20`}>
              <div
                tabIndex={0}
                role="button"
                onMouseDown={dropdownTriggerer}
                className="btn btn-sm btn-circle text-base-content opacity-50 hover:opacity-100 z-10"
              >
                <i title="More" className="bi-three-dots text-xl" />
              </div>
              <ul
                className={`dropdown-content z-[20] menu shadow bg-base-200 border border-neutral-content rounded-box`}
              >
                {
                  <li>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        (document?.activeElement as HTMLElement)?.blur();
                        onPin();
                      }}
                      className="whitespace-nowrap"
                    >
                      {link?.pinnedBy && link.pinnedBy[0]
                        ? t("unpin")
                        : t("pin_to_dashboard")}
                    </div>
                  </li>
                }
                {link.type === "url" &&
                  (permissions === true || permissions?.canUpdate) && (
                    <li>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          (document?.activeElement as HTMLElement)?.blur();
                          onUpdateArchive();
                        }}
                        className="whitespace-nowrap"
                      >
                        {t("refresh_preserved_formats")}
                      </div>
                    </li>
                  )}
                {(permissions === true || permissions?.canDelete) && (
                  <li>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={async (e) => {
                        (document?.activeElement as HTMLElement)?.blur();
                        console.log(e.shiftKey);
                        if (e.shiftKey) {
                          const load = toast.loading(t("deleting"));

                          await deleteLink.mutateAsync(link.id as number, {
                            onSettled: (data, error) => {
                              toast.dismiss(load);

                              if (error) {
                                toast.error(error.message);
                              } else {
                                toast.success(t("deleted"));
                              }
                            },
                          });
                          onClose();
                        } else {
                          onDelete();
                          onClose();
                        }
                      }}
                      className="whitespace-nowrap"
                    >
                      {t("delete")}
                    </div>
                  </li>
                )}
              </ul>
            </div>
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
