import Image from "next/image";
import React, { ReactNode } from "react";

interface Props {
  text?: string;
  children: ReactNode;
}

export default function CenteredForm({ text, children }: Props) {
  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center p-2">
      <div className="m-auto flex flex-col gap-2">
        <Image
          src="/linkwarden.png"
          width={518}
          height={145}
          alt="Linkwarden"
          className="h-12 w-fit mx-auto"
        />
        {text ? (
          <p className="text-lg sm:w-[30rem] w-80 mx-auto font-semibold text-black dark:text-white px-2 text-center">
            {text}
          </p>
        ) : undefined}
        {children}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Linkwarden. All rights reserved.
        </p>
      </div>
    </div>
  );
}
