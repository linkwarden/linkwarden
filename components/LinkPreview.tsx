import { faFolder, faLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { faCalendarDays } from "@fortawesome/free-regular-svg-icons";
import isValidUrl from "@/lib/client/isValidUrl";
import A from "next/link";
import unescapeString from "@/lib/client/unescapeString";
import { Link } from "@prisma/client";

type Props = {
  link?: Partial<Link>;
  className?: string;
  settings: {
    blurredFavicons: boolean;
    displayLinkIcons: boolean;
  };
};

export default function LinkPreview({ link, className, settings }: Props) {
  if (!link) {
    link = {
      name: "Linkwarden",
      url: "https://linkwarden.app",
      createdAt: Date.now() as unknown as Date,
    };
  }

  let shortendURL;

  try {
    shortendURL = new URL(link.url as string).host.toLowerCase();
  } catch (error) {
    console.log(error);
  }

  const url = isValidUrl(link.url as string)
    ? new URL(link.url as string)
    : undefined;

  const formattedDate = new Date(link.createdAt as Date).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <>
      <div
        className={`h-fit border border-solid border-sky-100 dark:border-neutral-700 bg-gradient-to-tr from-slate-200 dark:from-neutral-800 from-10% to-gray-50 dark:to-[#303030] via-20% shadow hover:shadow-none duration-100 rounded-2xl relative group ${
          className || ""
        }`}
      >
        <div className="flex items-start cursor-pointer gap-5 sm:gap-10 h-full w-full p-5">
          {url && settings?.displayLinkIcons && (
            <Image
              src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
              width={64}
              height={64}
              alt=""
              className={`${
                settings.blurredFavicons ? "blur-sm " : ""
              }absolute w-16 group-hover:opacity-80 duration-100 rounded-2xl bottom-5 right-5 opacity-60 select-none`}
              draggable="false"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />
          )}

          <div className="flex justify-between gap-5 w-full h-full z-0">
            <div className="flex flex-col justify-between w-full">
              <div className="flex items-baseline gap-1">
                <p className="text-sm text-gray-500 dark:text-gray-300">{1}</p>
                <p className="text-lg text-black dark:text-white truncate capitalize w-full pr-8">
                  {unescapeString(link.name as string)}
                </p>
              </div>
              <div className="flex items-center gap-1 max-w-full w-fit my-1 hover:opacity-70 duration-100">
                <FontAwesomeIcon
                  icon={faFolder}
                  className="w-4 h-4 mt-1 drop-shadow text-sky-400"
                />
                <p className="text-black dark:text-white truncate capitalize w-full">
                  Landing Pages ⚡️
                </p>
              </div>
              <A
                href={link.url as string}
                target="_blank"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="flex items-center gap-1 max-w-full w-fit text-gray-500 dark:text-gray-300 hover:opacity-70 duration-100"
              >
                <FontAwesomeIcon icon={faLink} className="mt-1 w-4 h-4" />
                <p className="truncate w-full">{shortendURL}</p>
              </A>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-300">
                <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4" />
                <p>{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
