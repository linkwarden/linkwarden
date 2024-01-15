import React, { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import toast from "react-hot-toast";
import Link from "next/link";
import Modal from "../Modal";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import {
  pdfAvailable,
  readabilityAvailable,
  screenshotAvailable,
} from "@/lib/shared/getArchiveValidity";
import PreservedFormatRow from "@/components/PreserverdFormatRow";
import useAccountStore from "@/store/account";
import getPublicUserData from "@/lib/client/getPublicUserData";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function PreservedFormatsModal({ onClose, activeLink }: Props) {
  const session = useSession();
  const { getLink } = useLinkStore();

  const { account } = useAccountStore();

  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  const router = useRouter();

  let isPublic = router.pathname.startsWith("/public") ? true : undefined;

  const [collectionOwner, setCollectionOwner] = useState({
    id: null as unknown as number,
    name: "",
    username: "",
    image: "",
    archiveAsScreenshot: undefined as unknown as boolean,
    archiveAsPDF: undefined as unknown as boolean,
  });

  useEffect(() => {
    const fetchOwner = async () => {
      if (link.collection.ownerId !== account.id) {
        const owner = await getPublicUserData(
          link.collection.ownerId as number
        );
        setCollectionOwner(owner);
      } else if (link.collection.ownerId === account.id) {
        setCollectionOwner({
          id: account.id as number,
          name: account.name,
          username: account.username as string,
          image: account.image as string,
          archiveAsScreenshot: account.archiveAsScreenshot as boolean,
          archiveAsPDF: account.archiveAsPDF as boolean,
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
      (collectionOwner.archiveAsPDF === true
        ? link.pdf && link.pdf !== "pending"
        : true) &&
      link.readable &&
      link.readable !== "pending"
    );
  };

  useEffect(() => {
    (async () => {
      const data = await getLink(link.id as number, isPublic);
      setLink(
        (data as any).response as LinkIncludingShortenedCollectionAndTags
      );
    })();

    let interval: any;

    if (!isReady()) {
      interval = setInterval(async () => {
        const data = await getLink(link.id as number, isPublic);
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
  }, [link?.image, link?.pdf, link?.readable]);

  const updateArchive = async () => {
    const load = toast.loading("Sending request...");

    const response = await fetch(`/api/v1/links/${link?.id}/archive`, {
      method: "PUT",
    });

    const data = await response.json();

    toast.dismiss(load);

    if (response.ok) {
      const newLink = await getLink(link?.id as number);
      setLink(
        (newLink as any).response as LinkIncludingShortenedCollectionAndTags
      );
      toast.success(`Link is being archived...`);
    } else toast.error(data.response);
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">Preserved Formats</p>

      <div className="divider mb-2 mt-1"></div>

      {isReady() &&
      (screenshotAvailable(link) ||
        pdfAvailable(link) ||
        readabilityAvailable(link)) ? (
        <p className="mb-3">
          The following formats are available for this link:
        </p>
      ) : (
        ""
      )}

      <div className={`flex flex-col gap-3`}>
        {isReady() ? (
          <>
            {screenshotAvailable(link) ? (
              <PreservedFormatRow
                name={"Screenshot"}
                icon={"bi-file-earmark-image"}
                format={
                  link?.image?.endsWith("png")
                    ? ArchivedFormat.png
                    : ArchivedFormat.jpeg
                }
                activeLink={link}
                downloadable={true}
              />
            ) : undefined}

            {pdfAvailable(link) ? (
              <PreservedFormatRow
                name={"PDF"}
                icon={"bi-file-earmark-pdf"}
                format={ArchivedFormat.pdf}
                activeLink={link}
                downloadable={true}
              />
            ) : undefined}

            {readabilityAvailable(link) ? (
              <PreservedFormatRow
                name={"Readable"}
                icon={"bi-file-earmark-text"}
                format={ArchivedFormat.readability}
                activeLink={link}
              />
            ) : undefined}
          </>
        ) : (
          <div
            className={`w-full h-full flex flex-col justify-center p-10 skeleton bg-base-200`}
          >
            <i className="bi-stack drop-shadow text-primary text-8xl mx-auto mb-5"></i>
            <p className="text-center text-2xl">
              Link preservation is in the queue
            </p>
            <p className="text-center text-lg">
              Please check back later to see the result
            </p>
          </div>
        )}

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
            className={`text-neutral duration-100 hover:opacity-60 flex gap-2 w-1/2 justify-center items-center text-sm`}
          >
            <p className="whitespace-nowrap">
              View latest snapshot on archive.org
            </p>
            <i className="bi-box-arrow-up-right" />
          </Link>
          {link?.collection.ownerId === session.data?.user.id ? (
            <div className={`btn btn-outline`} onClick={() => updateArchive()}>
              <div>
                <p>Refresh Preserved Formats</p>
                <p className="text-xs">
                  This deletes the current preservations
                </p>
              </div>
            </div>
          ) : undefined}
        </div>
      </div>
    </Modal>
  );
}
