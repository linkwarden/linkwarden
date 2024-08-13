import React, { useEffect, useState } from "react";
import {
  LinkIncludingShortenedCollectionAndTags,
  ArchivedFormat,
} from "@/types/global";
import toast from "react-hot-toast";
import Link from "next/link";
import Modal from "../Modal";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  pdfAvailable,
  readabilityAvailable,
  monolithAvailable,
  screenshotAvailable,
} from "@/lib/shared/getArchiveValidity";
import PreservedFormatRow from "@/components/PreserverdFormatRow";
import getPublicUserData from "@/lib/client/getPublicUserData";
import { useTranslation } from "next-i18next";
import { BeatLoader } from "react-spinners";
import { useUser } from "@/hooks/store/user";
import { useGetLink } from "@/hooks/store/links";

type Props = {
  onClose: Function;
  link: LinkIncludingShortenedCollectionAndTags;
};

export default function PreservedFormatsModal({ onClose, link }: Props) {
  const { t } = useTranslation();
  const session = useSession();
  const getLink = useGetLink();
  const { data: user = {} } = useUser();
  const router = useRouter();

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

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
      await getLink.mutateAsync(link.id as number);
    })();

    let interval: any;

    if (!isReady()) {
      interval = setInterval(async () => {
        await getLink.mutateAsync(link.id as number);
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

  const updateArchive = async () => {
    const load = toast.loading(t("sending_request"));

    const response = await fetch(`/api/v1/links/${link?.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();
    toast.dismiss(load);

    if (response.ok) {
      await getLink.mutateAsync(link?.id as number);

      toast.success(t("link_being_archived"));
    } else toast.error(data.response);
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("preserved_formats")}</p>
      <div className="divider mb-2 mt-1"></div>
      {screenshotAvailable(link) ||
      pdfAvailable(link) ||
      readabilityAvailable(link) ||
      monolithAvailable(link) ? (
        <p className="mb-3">{t("available_formats")}</p>
      ) : (
        ""
      )}

      <div className={`flex flex-col gap-3`}>
        {monolithAvailable(link) ? (
          <PreservedFormatRow
            name={t("webpage")}
            icon={"bi-filetype-html"}
            format={ArchivedFormat.monolith}
            link={link}
            downloadable={true}
          />
        ) : undefined}

        {screenshotAvailable(link) ? (
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
        ) : undefined}

        {pdfAvailable(link) ? (
          <PreservedFormatRow
            name={t("pdf")}
            icon={"bi-file-earmark-pdf"}
            format={ArchivedFormat.pdf}
            link={link}
            downloadable={true}
          />
        ) : undefined}

        {readabilityAvailable(link) ? (
          <PreservedFormatRow
            name={t("readable")}
            icon={"bi-file-earmark-text"}
            format={ArchivedFormat.readability}
            link={link}
          />
        ) : undefined}

        {!isReady() && !atLeastOneFormatAvailable() ? (
          <div className={`w-full h-full flex flex-col justify-center p-10`}>
            <BeatLoader
              color="oklch(var(--p))"
              className="mx-auto mb-3"
              size={30}
            />

            <p className="text-center text-2xl">{t("preservation_in_queue")}</p>
            <p className="text-center text-lg">{t("check_back_later")}</p>
          </div>
        ) : !isReady() && atLeastOneFormatAvailable() ? (
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

        <div
          className={`flex flex-col sm:flex-row gap-3 items-center justify-center ${
            isReady() ? "sm:mt " : ""
          }`}
        >
          <Link
            href={`https://web.archive.org/web/${link?.url?.replace(
              /(^\w+:|^)\/\//,
              ""
            )}`}
            target="_blank"
            className="text-neutral duration-100 hover:opacity-60 flex gap-2 w-1/2 justify-center items-center text-sm"
          >
            <p className="whitespace-nowrap">{t("view_latest_snapshot")}</p>
            <i className="bi-box-arrow-up-right" />
          </Link>
          {link?.collection.ownerId === session.data?.user.id && (
            <div className="btn btn-outline" onClick={updateArchive}>
              <div>
                <p>{t("refresh_preserved_formats")}</p>
                <p className="text-xs">
                  {t("this_deletes_current_preservations")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
