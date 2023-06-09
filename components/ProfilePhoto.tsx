import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import avatarExists from "@/lib/client/avatarExists";

type Props = {
  src: string;
  className?: string;
  emptyImage?: boolean;
};

export default function ProfilePhoto({ src, className, emptyImage }: Props) {
  const [error, setError] = useState<boolean>(emptyImage || true);

  const checkAvatarExistence = async () => {
    const canPass = await avatarExists(src);

    setError(!canPass);
  };

  useEffect(() => {
    if (src) checkAvatarExistence();
  }, [src]);

  return error ? (
    <div
      className={`bg-sky-500 text-white h-10 w-10 shadow rounded-full border-[3px] border-slate-200 flex items-center justify-center ${className}`}
    >
      <FontAwesomeIcon icon={faUser} className="w-1/2 h-1/2" />
    </div>
  ) : (
    <Image
      alt="Avatar"
      src={src}
      height={112}
      width={112}
      className={`h-10 w-10 shadow rounded-full border-[3px] border-slate-200 ${className}`}
    />
  );
}
