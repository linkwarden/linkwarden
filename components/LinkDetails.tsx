import React, { useEffect, useState } from "react";
import {
  LinkIncludingShortenedCollectionAndTags,
  ArchivedFormat,
} from "@/types/global";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  pdfAvailable,
  readabilityAvailable,
  monolithAvailable,
  screenshotAvailable,
  previewAvailable,
} from "@/lib/shared/getArchiveValidity";
import PreservedFormatRow from "@/components/PreserverdFormatRow";
import getPublicUserData from "@/lib/client/getPublicUserData";
import { useTranslation } from "next-i18next";
import { BeatLoader } from "react-spinners";
import { useUser } from "@/hooks/store/user";
import { useGetLink, useUpdateLink } from "@/hooks/store/links";
import LinkIcon from "./LinkViews/LinkComponents/LinkIcon";
import CopyButton from "./CopyButton";
import { useRouter } from "next/router";
import Icon from "./Icon";
import { IconWeight } from "@phosphor-icons/react";
import Image from "next/image";
import clsx from "clsx";
import toast from "react-hot-toast";
import EditButton from "./EditButton";
import CollectionSelection from "./InputSelect/CollectionSelection";
import TagSelection from "./InputSelect/TagSelection";
import unescapeString from "@/lib/client/unescapeString";
import IconPopover from "./IconPopover";

type Props = {
  className?: string;
  activeLink: LinkIncludingShortenedCollectionAndTags;
  standalone?: boolean;
};

export default function LinkDetails({
  className,
  activeLink,
  standalone,
}: Props) {
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  const { t } = useTranslation();
  const session = useSession();
  const getLink = useGetLink();
  const { data: user = {} } = useUser();

  const [collectionOwner, setCollectionOwner] = useState({
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsMonolith: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

  useEffect(() => {
    const fetchOwner = async () => {
      if (link.collection.ownerId !== user.id) {
        const owner = await getPublicUserData(
          link.collection.ownerId as number
        );
        setCollectionOwner(owner);
      } else if (link.collection.ownerId === user.id) {
        setCollectionOwner({
          id: user.id as number,
          name: user.name,
          username: user.username as string,
          image: user.image as string,
          archiveAsScreenshot: user.archiveAsScreenshot as boolean,
          archiveAsMonolith: user.archiveAsScreenshot as boolean,
          archiveAsPDF: user.archiveAsPDF as boolean,
        });
      }
    };

    fetchOwner();
  }, [link.collection.ownerId]);

  const isReady = () => {
    return (
      link &&
      (collectionOwner.archiveAsScreenshot === true
        ? link.pdf && link.pdf !== "pending"
        : true) &&
      (collectionOwner.archiveAsMonolith === true
        ? link.monolith && link.monolith !== "pending"
        : true) &&
      (collectionOwner.archiveAsPDF === true
        ? link.pdf && link.pdf !== "pending"
        : true) &&
      link.readable &&
      link.readable !== "pending"
    );
  };

  const atLeastOneFormatAvailable = () => {
    return (
      screenshotAvailable(link) ||
      pdfAvailable(link) ||
      readabilityAvailable(link) ||
      monolithAvailable(link)
    );
  };

  useEffect(() => {
    (async () => {
      await getLink.mutateAsync({
        id: link.id as number,
      });
    })();

    let interval: any;

    if (!isReady()) {
      interval = setInterval(async () => {
        await getLink.mutateAsync({
          id: link.id as number,
        });
      }, 5000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [link?.monolith]);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  const updateLink = useUpdateLink();

  const [fieldToEdit, setFieldToEdit] = useState<
    "name" | "collection" | "tags" | "description" | null
  >(null);

  const submit = async (e?: any) => {
    e?.preventDefault();

    const { updatedAt: b, ...oldLink } = activeLink;
    const { updatedAt: a, ...newLink } = link;

    console.log(oldLink);
    console.log(newLink);

    if (JSON.stringify(oldLink) === JSON.stringify(newLink)) {
      setFieldToEdit(null);
      return;
    }

    const load = toast.loading(t("updating"));

    await updateLink.mutateAsync(link, {
      onSettled: (data, error) => {
        toast.dismiss(load);

        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t("updated"));
          setFieldToEdit(null);
          console.log(data);
          setLink(data);
        }
      },
    });
  };

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;
    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => ({ name: e.label }));
    setLink({ ...link, tags: tagNames });
  };

  const [iconPopover, setIconPopover] = useState(false);

  return (
    <div className={clsx(className)} data-vaul-no-drag>
      <div
        className={clsx(
          standalone && "sm:border sm:border-neutral-content sm:rounded-2xl p-5"
        )}
      >
        <div
          className={clsx(
            "overflow-hidden select-none relative h-32 opacity-80 group",
            standalone
              ? "sm:max-w-xl -mx-5 -mt-5 sm:rounded-t-2xl"
              : "-mx-4 -mt-4"
          )}
        >
          {previewAvailable(link) ? (
            <Image
              src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true`}
              width={1280}
              height={720}
              alt=""
              className="object-cover scale-105"
              style={{
                filter: "blur(1px)",
              }}
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />
          ) : link.preview === "unavailable" ? (
            <div className="bg-gray-50 duration-100 h-32"></div>
          ) : (
            <div className="duration-100 h-32 skeleton rounded-b-none"></div>
          )}

          <div className="absolute top-0 bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 duration-100 flex justify-end items-end">
            <label className="btn btn-xs mb-2 mr-12 opacity-50 hover:opacity-100">
              {t("upload_preview_image")}
              <input
                type="file"
                accept="image/jpg, image/jpeg, image/png"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const formData = new FormData();
                  formData.append("file", file);

                  const load = toast.loading(t("uploading"));

                  try {
                    const res = await fetch(
                      `/api/v1/archives/${link.id}/preview`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    );

                    if (!res.ok) {
                      throw new Error(await res.text());
                    }

                    const data = await res.json();

                    setLink({
                      ...link,
                      preview: data.preview,
                    });

                    toast.success(t("uploaded"));
                  } catch (error) {
                    console.error(error);
                  } finally {
                    toast.dismiss(load);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="-mt-14 ml-8 relative w-fit pb-2">
          <div className="tooltip tooltip-bottom" data-tip={t("change_icon")}>
            <LinkIcon
              link={link}
              className="hover:bg-opacity-70 duration-100 cursor-pointer"
              onClick={() => setIconPopover(true)}
            />
          </div>
          {/* #006796 */}
          {iconPopover && (
            <IconPopover
              color={link.color || "#006796"}
              setColor={(color: string) => setLink({ ...link, color })}
              weight={(link.iconWeight || "regular") as IconWeight}
              setWeight={(iconWeight: string) =>
                setLink({ ...link, iconWeight })
              }
              iconName={link.icon as string}
              setIconName={(icon: string) => setLink({ ...link, icon })}
              reset={() =>
                setLink({
                  ...link,
                  color: "",
                  icon: "",
                  iconWeight: "",
                })
              }
              className="top-12"
              onClose={() => {
                setIconPopover(false);
                submit();
              }}
            />
          )}
        </div>

        <div className="max-w-xl sm:px-8 p-5 pb-8 pt-2">
          {fieldToEdit !== "name" ? (
            <div className="text-xl mt-2 group pr-7">
              <p
                className={clsx("relative w-fit", !link.name && "text-neutral")}
              >
                {link.name || t("untitled")}
                <EditButton
                  onClick={() => setFieldToEdit("name")}
                  className="top-0"
                />
              </p>
            </div>
          ) : fieldToEdit === "name" ? (
            <form onSubmit={submit} className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                onBlur={submit}
                className="text-xl bg-transparent h-9 w-full outline-none border-b border-b-neutral-content"
                value={link.name}
                onChange={(e) => setLink({ ...link, name: e.target.value })}
              />
            </form>
          ) : undefined}

          {link.url && (
            <>
              <br />

              <p className="text-sm mb-2 text-neutral">{t("link")}</p>

              <div className="relative">
                <div className="rounded-md p-2 bg-base-200 hide-scrollbar overflow-x-auto whitespace-nowrap flex justify-between items-center gap-2 pr-14">
                  <Link href={link.url} title={link.url} target="_blank">
                    {link.url}
                  </Link>
                  <div className="absolute right-0 px-2 bg-base-200">
                    <CopyButton text={link.url} />
                  </div>
                </div>
              </div>
            </>
          )}

          <br />

          <div className="group relative">
            <p className="text-sm mb-2 text-neutral relative w-fit flex justify-between">
              {t("collection")}
              {fieldToEdit !== "collection" && (
                <EditButton
                  onClick={() => setFieldToEdit("collection")}
                  className="bottom-0"
                />
              )}
            </p>

            {fieldToEdit !== "collection" ? (
              <div className="relative">
                <Link
                  href={
                    isPublicRoute
                      ? `/public/collections/${link.collection.id}`
                      : `/collections/${link.collection.id}`
                  }
                  className="rounded-md p-2 bg-base-200 border border-base-200 hide-scrollbar overflow-x-auto whitespace-nowrap flex justify-between items-center gap-2 pr-14"
                >
                  <p>{link.collection.name}</p>
                  <div className="absolute right-0 px-2 bg-base-200">
                    {link.collection.icon ? (
                      <Icon
                        icon={link.collection.icon}
                        size={30}
                        weight={
                          (link.collection.iconWeight ||
                            "regular") as IconWeight
                        }
                        color={link.collection.color}
                      />
                    ) : (
                      <i
                        className="bi-folder-fill text-2xl"
                        style={{ color: link.collection.color }}
                      ></i>
                    )}
                  </div>
                </Link>
              </div>
            ) : fieldToEdit === "collection" ? (
              <CollectionSelection
                onChange={setCollection}
                defaultValue={
                  link.collection.id
                    ? { value: link.collection.id, label: link.collection.name }
                    : { value: null as unknown as number, label: "Unorganized" }
                }
                creatable={false}
                autoFocus
                onBlur={submit}
              />
            ) : undefined}
          </div>

          <br />

          <div className="group relative">
            <p className="text-sm mb-2 text-neutral relative w-fit flex justify-between">
              {t("tags")}
              {fieldToEdit !== "tags" && (
                <EditButton
                  onClick={() => setFieldToEdit("tags")}
                  className="bottom-0"
                />
              )}
            </p>

            {fieldToEdit !== "tags" ? (
              <div className="flex gap-2 flex-wrap rounded-md p-2 bg-base-200 border border-base-200 w-full text-xs">
                {link.tags[0] ? (
                  link.tags.map((tag) =>
                    isPublicRoute ? (
                      <div
                        key={tag.id}
                        className="bg-base-200 p-1 hover:bg-neutral-content rounded-md duration-100"
                      >
                        {tag.name}
                      </div>
                    ) : (
                      <Link
                        href={"/tags/" + tag.id}
                        key={tag.id}
                        className="bg-base-200 p-1 hover:bg-neutral-content btn btn-xs btn-ghost rounded-md"
                      >
                        {tag.name}
                      </Link>
                    )
                  )
                ) : (
                  <div className="text-neutral text-base">{t("no_tags")}</div>
                )}
              </div>
            ) : (
              <TagSelection
                onChange={setTags}
                defaultValue={link.tags.map((e) => ({
                  label: e.name,
                  value: e.id,
                }))}
                autoFocus
                onBlur={submit}
              />
            )}
          </div>

          <br />

          <div className="relative group">
            <p className="text-sm mb-2 text-neutral relative w-fit flex justify-between">
              {t("description")}
              {fieldToEdit !== "description" && (
                <EditButton
                  onClick={() => setFieldToEdit("description")}
                  className="bottom-0"
                />
              )}
            </p>

            {fieldToEdit !== "description" ? (
              <div className="rounded-md p-2 bg-base-200 hyphens-auto">
                {link.description ? (
                  <p>{link.description}</p>
                ) : (
                  <p className="text-neutral">{t("no_description_provided")}</p>
                )}
              </div>
            ) : (
              <textarea
                value={unescapeString(link.description) as string}
                onChange={(e) =>
                  setLink({ ...link, description: e.target.value })
                }
                placeholder={t("link_description_placeholder")}
                className="resize-none w-full rounded-md p-2 h-32 border-neutral-content bg-base-200 focus:border-primary border-solid border outline-none duration-100"
                autoFocus
                onBlur={submit}
              />
            )}
          </div>

          <br />

          <p
            className="text-sm mb-2 text-neutral"
            title={t("available_formats")}
          >
            {link.url ? t("preserved_formats") : t("file")}
          </p>

          <div className={`flex flex-col rounded-md p-3 bg-base-200`}>
            {monolithAvailable(link) ? (
              <>
                <PreservedFormatRow
                  name={t("webpage")}
                  icon={"bi-filetype-html"}
                  format={ArchivedFormat.monolith}
                  link={link}
                  downloadable={true}
                />
                <hr className="m-3 border-t border-neutral-content" />
              </>
            ) : undefined}

            {screenshotAvailable(link) ? (
              <>
                <PreservedFormatRow
                  name={t("screenshot")}
                  icon={"bi-file-earmark-image"}
                  format={
                    link?.image?.endsWith("png")
                      ? ArchivedFormat.png
                      : ArchivedFormat.jpeg
                  }
                  link={link}
                  downloadable={true}
                />
                <hr className="m-3 border-t border-neutral-content" />
              </>
            ) : undefined}

            {pdfAvailable(link) ? (
              <>
                <PreservedFormatRow
                  name={t("pdf")}
                  icon={"bi-file-earmark-pdf"}
                  format={ArchivedFormat.pdf}
                  link={link}
                  downloadable={true}
                />
                <hr className="m-3 border-t border-neutral-content" />
              </>
            ) : undefined}

            {readabilityAvailable(link) ? (
              <>
                <PreservedFormatRow
                  name={t("readable")}
                  icon={"bi-file-earmark-text"}
                  format={ArchivedFormat.readability}
                  link={link}
                />
                <hr className="m-3 border-t border-neutral-content" />
              </>
            ) : undefined}

            {!isReady() && !atLeastOneFormatAvailable() ? (
              <div
                className={`w-full h-full flex flex-col justify-center p-10`}
              >
                <BeatLoader
                  color="oklch(var(--p))"
                  className="mx-auto mb-3"
                  size={30}
                />

                <p className="text-center text-2xl">
                  {t("preservation_in_queue")}
                </p>
                <p className="text-center text-lg">{t("check_back_later")}</p>
              </div>
            ) : link.url && !isReady() && atLeastOneFormatAvailable() ? (
              <div className={`w-full h-full flex flex-col justify-center p-5`}>
                <BeatLoader
                  color="oklch(var(--p))"
                  className="mx-auto mb-3"
                  size={20}
                />
                <p className="text-center">{t("there_are_more_formats")}</p>
                <p className="text-center text-sm">{t("check_back_later")}</p>
              </div>
            ) : undefined}

            {link.url && (
              <Link
                href={`https://web.archive.org/web/${link?.url?.replace(
                  /(^\w+:|^)\/\//,
                  ""
                )}`}
                target="_blank"
                className="text-neutral mx-auto duration-100 hover:opacity-60 flex gap-2 w-1/2 justify-center items-center text-sm"
              >
                <p className="whitespace-nowrap">{t("view_latest_snapshot")}</p>
                <i className="bi-box-arrow-up-right" />
              </Link>
            )}
          </div>

          <br />

          <p className="text-neutral text-xs text-center">
            {t("saved")}{" "}
            {new Date(link.createdAt || "").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {new Date(link.createdAt || "").toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
