import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { ReactNode } from "react";

interface Props {
  header?: string;
  text?: string;
  className?: string;
  children: ReactNode;
  "data-testid"?: string;
}

export default function CenteredForm({
  header,
  text,
  children,
  className,
  "data-testid": dataTestId,
}: Props) {
  return (
    <div
      className={cn(
        "flex min-h-screen justify-center items-center p-5",
        className
      )}
      data-testid={dataTestId}
    >
      <div className="m-auto flex flex-col gap-3 w-full">
        <Image
          src={"/icon-small-150x150.png"}
          width={150}
          height={150}
          alt="Linkwarden"
          className="h-16 w-auto mx-auto"
          priority
        />
        {header && (
          <p className="text-2xl text-black dark:text-white text-center font-semibold">
            {header}
          </p>
        )}
        {text && (
          <p className="text-lg max-w-[30rem] min-w-80 w-full mx-auto px-2 font-light text-center">
            {text}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
