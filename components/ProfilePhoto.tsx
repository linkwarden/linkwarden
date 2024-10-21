import React, { useEffect, useState } from "react";
import Image from "next/image";

type Props = {
  src?: string;
  className?: string;
  priority?: boolean;
  name?: string | null;
  large?: boolean;
};

export default function ProfilePhoto({
  src,
  className,
  priority,
  name,
  large,
}: Props) {
  const [image, setImage] = useState("");

  useEffect(() => {
    if (src && !src?.includes("base64") && !src.startsWith("http"))
      setImage(`/api/v1/${src.replace("uploads/", "").replace(".jpg", "")}`);
    else if (!src) setImage("");
    else {
      setImage(src);
    }
  }, [src]);

  return !image ? (
    <div
      className={`avatar drop-shadow-md placeholder ${className || ""} ${
        large ? "w-28 h-28" : "w-8 h-8"
      }`}
    >
      <div className="bg-base-100 text-neutral rounded-full w-full h-full ring-2 ring-neutral-content select-none">
        {name ? (
          <span className="text-2xl capitalize">{name.slice(0, 1)}</span>
        ) : (
          <i className={`bi-person ${large ? "text-5xl" : "text-xl"}`}></i>
        )}
      </div>
    </div>
  ) : (
    <div
      className={`avatar skeleton rounded-full drop-shadow-md ${
        className || ""
      } ${large ? "w-28 h-28" : "w-8 h-8"}`}
    >
      <div className="rounded-full w-full h-full ring-2 ring-neutral-content">
        <Image
          alt=""
          src={image}
          height={112}
          width={112}
          priority={priority}
          draggable={false}
          onError={() => setImage("")}
          className="aspect-square rounded-full"
        />
      </div>
    </div>
  );
}
