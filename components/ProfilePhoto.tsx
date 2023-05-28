import React from "react";
import ImageWithFallback from "./ImageWithFallback";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

type Props = {
  src: string;
  className?: string;
};

export default function ProfilePhoto({ src, className }: Props) {
  return (
    <ImageWithFallback
      src={src}
      className={`h-10 w-10 shadow rounded-full border-[3px] border-sky-100 ${className}`}
    >
      <div
        className={`bg-sky-500 text-white h-10 w-10 shadow rounded-full border-[3px] border-sky-100 flex items-center justify-center ${className}`}
      >
        <FontAwesomeIcon icon={faUser} className="w-5 h-5" />
      </div>
    </ImageWithFallback>
  );
}
