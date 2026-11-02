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
  const [photo, setPhoto] = useState({ src: "", loaded: false });

  useEffect(() => {
    const next =
      src && !src.includes("base64") && !src.startsWith("http")
        ? `/api/v1/${src.replace("uploads/", "").replace(".jpg", "")}`
        : src || "";

    // A different photo starts loading again; aliases of the same URL keep
    // the current image and its loaded state.
    setPhoto((previous) =>
      previous.src === next ? previous : { src: next, loaded: false }
    );
  }, [src]);

  return !photo.src ? (
    <div
      className={`avatar drop-shadow-md placeholder ${className || ""} ${
        large ? "w-28 h-28" : "w-8 h-8"
      }`}
    >
      <div className="bg-base-100 text-neutral rounded-full w-full h-full ring-2 ring-neutral-content select-none">
        {name ? (
          <span className="text-xl capitalize">{name.slice(0, 1)}</span>
        ) : (
          <i className={`bi-person ${large ? "text-5xl" : "text-xl"}`}></i>
        )}
      </div>
    </div>
  ) : (
    <div
      className={`avatar ${
        photo.loaded ? "" : "skeleton"
      } rounded-full drop-shadow-md ${className || ""} ${
        large ? "w-28 h-28" : "w-8 h-8"
      }`}
    >
      <div className="rounded-full w-full h-full ring-2 ring-neutral-content">
        <Image
          // A new photo gets a new <img>, so a load still finishing for the
          // previous one can't count for it.
          key={photo.src}
          alt=""
          src={photo.src}
          height={112}
          width={112}
          priority={priority}
          draggable={false}
          // Also called for a photo the browser already has.
          onLoad={() =>
            setPhoto((previous) =>
              previous.src === photo.src
                ? { ...previous, loaded: true }
                : previous
            )
          }
          onError={() =>
            setPhoto((previous) =>
              previous.src === photo.src ? { src: "", loaded: false } : previous
            )
          }
          className="aspect-square rounded-full"
          unoptimized
        />
      </div>
    </div>
  );
}
