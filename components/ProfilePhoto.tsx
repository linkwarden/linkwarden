import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import avatarExists from "@/lib/client/avatarExists";

type Props = {
  src: string;
  className?: string;
  emptyImage?: boolean;
  status?: Function;
};

export default function ProfilePhoto({
  src,
  className,
  emptyImage,
  status,
}: Props) {
  const [error, setError] = useState<boolean>(emptyImage || true);

  const checkAvatarExistence = async () => {
    const canPass = await avatarExists(src);

    setError(!canPass);
  };

  useEffect(() => {
    if (src) checkAvatarExistence();

    status && status(error || !src);
  }, [src, error]);

  return error || !src ? (
    <div
      className={`bg-sky-600 dark:bg-sky-600 text-white h-10 w-10 aspect-square shadow rounded-full border border-slate-200 dark:border-neutral-700 flex items-center justify-center ${className}`}
    >
      <FontAwesomeIcon icon={faUser} className="w-1/2 h-1/2 aspect-square" />
    </div>
  ) : (
    <Image
      alt=""
      src={src}
      height={112}
      width={112}
      className={`h-10 w-10 bg-sky-600 dark:bg-sky-600 shadow rounded-full aspect-square border border-slate-200 dark:border-neutral-700 ${className}`}
    />
  );
}
