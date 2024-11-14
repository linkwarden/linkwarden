import { isPWA } from "@/lib/client/utils";
import React, { useState } from "react";
import { Trans } from "next-i18next";

type Props = {};

const InstallApp = (props: Props) => {
  const [isOpen, setIsOpen] = useState(true);

  return isOpen && !isPWA() ? (
    <div className="fixed left-0 right-0 bottom-10 w-full px-5">
      <div className="mx-auto w-fit p-2 flex justify-between gap-2 items-center border border-neutral-content rounded-xl bg-base-300 backdrop-blur-md bg-opacity-80 max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8"
          viewBox="0 0 50 50"
        >
          <path
            fill="currentColor"
            d="M30.3 13.7L25 8.4l-5.3 5.3l-1.4-1.4L25 5.6l6.7 6.7z"
          />
          <path fill="currentColor" d="M24 7h2v21h-2z" />
          <path
            fill="currentColor"
            d="M35 40H15c-1.7 0-3-1.3-3-3V19c0-1.7 1.3-3 3-3h7v2h-7c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V19c0-.6-.4-1-1-1h-7v-2h7c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3"
          />
        </svg>
        <p className="w-4/5 text-[0.92rem]">
          <Trans
            i18nKey="pwa_install_prompt"
            components={[
              <a
                className="underline"
                target="_blank"
                href="https://docs.linkwarden.app/getting-started/pwa-installation"
                key={0}
              />,
            ]}
          />
        </p>
        <button
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-square btn-sm"
        >
          <i className="bi-x text-xl"></i>
        </button>
      </div>
    </div>
  ) : (
    <></>
  );
};

export default InstallApp;
