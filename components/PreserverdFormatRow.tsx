import React, { useEffect, useState } from "react";
import useLinkStore from "@/store/links";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

type Props = {
  name: string;
  icon: string;
  format: ArchivedFormat;
  activeLink: LinkIncludingShortenedCollectionAndTags;
  downloadable?: boolean;
};

export default function PreservedFormatRow({
  name,
  icon,
  format,
  activeLink,
  downloadable,
}: Props) {
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

  const handleDownload = () => {
    const path = `/api/v1/archives/${link?.id}?format=${format}`;
    fetch(path)
      .then((response) => {
        if (response.ok) {
          // Create a temporary link and click it to trigger the download
          const link = document.createElement("a");
          link.href = path;
          link.download = format === ArchivedFormat.pdf ? "PDF" : "Screenshot";
          link.click();
        } else {
          console.error("Failed to download file");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div className="flex justify-between items-center pr-1 border border-neutral-content rounded-md">
      <div className="flex gap-2 items-center">
        <div className="bg-primary text-primary-content p-2 rounded-l-md">
          <i className={`${icon} text-2xl`} />
        </div>
        <p>{name}</p>
      </div>

      <div className="flex gap-1">
        {downloadable || false ? (
          <div
            onClick={() => handleDownload()}
            className="btn btn-sm btn-square"
          >
            <i className="bi-cloud-arrow-down text-xl text-neutral" />
          </div>
        ) : undefined}

        <Link
          href={`/preserved/${link?.id}?format=${format}`}
          target="_blank"
          className="btn btn-sm btn-square"
        >
          <i className="bi-box-arrow-up-right text-xl text-neutral" />
        </Link>
      </div>
    </div>
  );
}
