import React, { useEffect, useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import getPublicUserData from "@/lib/client/getPublicUserData";
import { useTranslation } from "next-i18next";
import { useUser } from "@/hooks/store/user";
import { useGetLink } from "@/hooks/store/links";
import Drawer from "../Drawer";
import LinkDetails from "../LinkDetails";
import Link from "next/link";
import usePermissions from "@/hooks/usePermissions";
import { useRouter } from "next/router";

type Props = {
  onClose: Function;
  onEdit: Function;
  link: LinkIncludingShortenedCollectionAndTags;
};

export default function LinkDetailModal({ onClose, onEdit, link }: Props) {
  const { t } = useTranslation();
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

  const permissions = usePermissions(link.collection.id as number);

  const router = useRouter();

  const isPublicRoute = router.pathname.startsWith("/public") ? true : false;

  return (
    <Drawer toggleDrawer={onClose} className="sm:h-screen sm:flex relative">
      <div
        className="bi-x text-xl text-neutral btn btn-sm btn-square btn-ghost hidden sm:block absolute top-3 left-3"
        onClick={() => onClose()}
      ></div>
      <Link
        href={isPublicRoute ? `/public/links/${link.id}` : `/links/${link.id}`}
        target="_blank"
        className="bi-box-arrow-up-right text-xl text-neutral btn btn-sm btn-square btn-ghost absolute top-3 right-3 select-none"
      ></Link>

      <div className="sm:m-auto p-10 w-full max-w-xl">
        <LinkDetails link={link} />

        {(permissions === true || permissions?.canUpdate) && (
          <>
            <br />
            <br />

            <div className="mx-auto text-center">
              <div
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  onEdit();
                  onClose();
                }}
              >
                {t("edit_link")}
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
