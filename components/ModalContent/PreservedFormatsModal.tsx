import React, { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import { ArchivedFormat, LinkIncludingShortenedCollectionAndTags, } from "@/types/global";
import toast from "react-hot-toast";
import Link from "next/link";
import Modal from "../Modal";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { pdfAvailable, readabilityAvailable, screenshotAvailable, } from "@/lib/shared/getArchiveValidity";
import PreservedFormatRow from "@/components/PreserverdFormatRow";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function PreservedFormatsModal({ onClose, activeLink }: Props) {
  const session = useSession();
  const { getLink } = useLinkStore();

  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  const router = useRouter();

  useEffect(() => {
    let isPublicRoute = router.pathname.startsWith("/public")
      ? true
      : undefined;

    (async () => {
      const data = await getLink(link.id as number, isPublicRoute);
      setLink(
        (data as any).response as LinkIncludingShortenedCollectionAndTags
      );
    })();

    let interval: any;
    if (link?.screenshotPath === "pending" || link?.pdfPath === "pending") {
      interval = setInterval(async () => {
        const data = await getLink(link.id as number, isPublicRoute);
        setLink(
          (data as any).response as LinkIncludingShortenedCollectionAndTags
        );
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
  }, [link?.screenshotPath, link?.pdfPath, link?.readabilityPath]);

  const updateArchive = async () => {
    const load = toast.loading("Sending request...");

    const response = await fetch(`/api/v1/links/${link?.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();

    toast.dismiss(load);

    if (response.ok) {
      toast.success(`Link is being archived...`);
      getLink(link?.id as number);
    } else toast.error(data.response);
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Preserved Formats</p>

      <div className="divider mb-2 mt-1"></div>

      {screenshotAvailable(link) ||
      pdfAvailable(link) ||
      readabilityAvailable(link) ? (
        <p className="mb-3">
          The following formats are available for this link:
        </p>
      ) : (
        <p className="mb-3">No preserved formats available.</p>
      )}

      <div className={`flex flex-col gap-3`}>
        {readabilityAvailable(link) ? (
          <PreservedFormatRow name={'Readable'} icon={'bi-file-earmark-text'} format={ArchivedFormat.readability}
                              activeLink={link}/>
        ) : undefined}

        {screenshotAvailable(link) ? (
          <PreservedFormatRow name={'Screenshot'} icon={'bi-file-earmark-image'} format={ArchivedFormat.png}
                              activeLink={link} downloadable={true}/>
        ) : undefined}

        {pdfAvailable(link) ? (
          <PreservedFormatRow name={'PDF'} icon={'bi-file-earmark-pdf'} format={ArchivedFormat.pdf}
                              activeLink={link} downloadable={true}/>
        ) : undefined}

        <div className="flex flex-col-reverse sm:flex-row sm:gap-3 items-center justify-center">
          {link?.collection.ownerId === session.data?.user.id ? (
            <div
              className={`btn btn-accent w-1/2 dark:border-violet-400 text-white ${
                screenshotAvailable(link) &&
                pdfAvailable(link) &&
                readabilityAvailable(link)
                  ? "mt-3"
                  : ""
              }`}
              onClick={() => updateArchive()}
            >
              <div>
                <p>Update Preserved Formats</p>
                <p className="text-xs">(Refresh Link)</p>
              </div>
            </div>
          ) : undefined}
          <Link
            href={`https://web.archive.org/web/${link?.url?.replace(
              /(^\w+:|^)\/\//,
              ""
            )}`}
            target="_blank"
            className={`text-neutral duration-100 hover:opacity-60 flex gap-2 w-1/2 justify-center items-center text-sm ${
              screenshotAvailable(link) &&
              pdfAvailable(link) &&
              readabilityAvailable(link)
                ? "sm:mt-3"
                : ""
            }`}
          >
            <p className="whitespace-nowrap">
              View latest snapshot on archive.org
            </p>
            <i className="bi-box-arrow-up-right"/>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
