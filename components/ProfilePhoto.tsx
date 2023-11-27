import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

type Props = {
  src?: string;
  className?: string;
  priority?: boolean;
  name?: string;
};

export default function ProfilePhoto({
  src,
  className,
  priority,
  name,
}: Props) {
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
    <div className={`avatar w-8 h-8 placeholder ${className || ""}`}>
      <div className="bg-base-100 text-base-content rounded-full w-full h-full ring-2 ring-base-content">
        {name ? (
          <span className="text-2xl capitalize">{name.slice(0, 1)}</span>
        ) : (
          <FontAwesomeIcon
            icon={faUser}
            className="w-1/2 h-1/2 aspect-square"
          />
        )}
      </div>
    </div>
  ) : (
    <div className={`avatar w-8 h-8 drop-shadow-md ${className || ""}`}>
      <div className="rounded-full w-full h-full ring-2 ring-base-content">
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
