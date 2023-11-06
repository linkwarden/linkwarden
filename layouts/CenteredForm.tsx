import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import React, { ReactNode } from "react";

interface Props {
  text?: string;
  children: ReactNode;
}

export default function CenteredForm({ text, children }: Props) {
  const { theme } = useTheme();

  return (
    <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center p-5">
      <div className="m-auto flex flex-col gap-2 w-full">
        {theme ? (
          <Image
            src={`/linkwarden_${theme === "dark" ? "dark" : "li"}.png`}
            width={640}
            height={136}
            alt="Linkwarden"
            className="h-12 w-fit mx-auto"
          />
        ) : undefined}
        {/* {theme === "dark" ? (
          <Image
            src="/linkwarden_dark.png"
            width={640}
            height={136}
            alt="Linkwarden"
            className="h-12 w-fit mx-auto"
          />
        ) : (
          <Image
            src="/linkwarden_light.png"
            width={640}
            height={136}
            alt="Linkwarden"
            className="h-12 w-fit mx-auto"
          />
        )} */}
        {text ? (
          <p className="text-lg max-w-[30rem] min-w-80 w-full mx-auto font-semibold text-black dark:text-white px-2 text-center">
            {text}
          </p>
        ) : undefined}
        {children}
        <p className="text-center text-xs text-gray-500 mb-5 dark:text-gray-400">
          © {new Date().getFullYear()}{" "}
          <Link href="https://linkwarden.app" className="font-semibold">
            Linkwarden
          </Link>
          . All rights reserved.
        </p>
      </div>
    </div>
  );
}
