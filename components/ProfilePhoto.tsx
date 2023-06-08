import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

type Props = {
  src: string;
  className?: string;
};

export default function ProfilePhoto({ src, className }: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return error || !src ? (
    <div
      className={`bg-sky-500 text-white h-10 w-10 shadow rounded-full border-[3px] border-slate-200 flex items-center justify-center ${className}`}
    >
      <FontAwesomeIcon icon={faUser} className="w-1/2 h-1/2" />
    </div>
  ) : (
    <img
      alt=""
      src={src}
      className={`h-10 w-10 shadow rounded-full border-[3px] border-slate-200 ${className}`}
      onError={() => {
        setError(true);
      }}
    />
  );
}
