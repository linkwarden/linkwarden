import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

type Props = {
  src?: string;
  className?: string;
  emptyImage?: boolean;
  priority?: boolean;
};

export default function ProfilePhoto({ src, className, priority }: Props) {
  const [image, setImage] = useState("");

  useEffect(() => {
    if (src && !src?.includes("base64"))
      setImage(`/api/v1/${src.replace("uploads/", "").replace(".jpg", "")}`);
    else if (!src) setImage("");
    else {
      setImage(src);
    }
  }, [src]);

  return !image ? (
    <div
      className={`bg-sky-600 dark:bg-sky-600 text-white h-10 w-10 aspect-square shadow rounded-full border border-slate-200 dark:border-neutral-700 flex items-center justify-center ${
        className || ""
      }`}
    >
      <FontAwesomeIcon icon={faUser} className="w-1/2 h-1/2 aspect-square" />
    </div>
  ) : (
    <Image
      alt=""
      src={image}
      height={112}
      width={112}
      priority={priority}
      draggable={false}
      className={`h-10 w-10 bg-sky-600 dark:bg-sky-600 shadow rounded-full aspect-square border border-slate-200 dark:border-neutral-700 ${
        className || ""
      }`}
    />
  );
}
