import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { Link as LinkType, Tag } from "@prisma/client";
import isValidUrl from "@/lib/client/isValidUrl";

interface LinksIncludingTags extends LinkType {
  tags: Tag[];
}

type Props = {
  link: LinksIncludingTags;
  count: number;
};

export default function LinkCard({ link, count }: Props) {
  const url = isValidUrl(link.url) ? new URL(link.url) : undefined;

  const formattedDate = new Date(
    link.createdAt as unknown as string
  ).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <a href={link.url} target="_blank" rel="noreferrer" className="rounded-3xl">
      <div className="border border-solid border-sky-100 bg-gradient-to-tr from-slate-200 from-10% to-gray-50 via-20% shadow-md sm:hover:shadow-none duration-100 rounded-3xl cursor-pointer p-5 flex items-start relative gap-5 sm:gap-10 group/item">
        {url && (
          <>
            <Image
              src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
              width={42}
              height={42}
              alt=""
              className="select-none mt-3 z-10 rounded-md shadow border-[3px] border-white bg-white"
              draggable="false"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />
            <Image
              src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
              width={80}
              height={80}
              alt=""
              className="blur-sm absolute left-2 opacity-40 select-none hidden sm:block"
              draggable="false"
              onError={(e) => {
                const target = e.target as HTMLElement;
                target.style.display = "none";
              }}
            />
          </>
        )}
        <div className="flex justify-between items-center gap-5 w-full h-full z-0">
          <div className="flex flex-col justify-between">
            <div className="flex items-baseline gap-1">
              <p className="text-xs text-gray-500">{count + 1}</p>
              <p className="text-lg text-black">
                {link.name || link.description}
              </p>
            </div>

            <p className="text-gray-500 text-sm font-medium">
              {link.description}
            </p>
            <div className="flex gap-3 items-center flex-wrap my-3">
              <div className="flex gap-1 items-center flex-wrap mt-1">
                {link.tags.map((e, i) => (
                  <p
                    key={i}
                    className="px-2 py-1 bg-sky-200 text-black text-xs rounded-3xl cursor-pointer truncate max-w-[10rem]"
                  >
                    {e.name}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap mt-2">
              <p className="text-gray-500">{formattedDate}</p>
              <div className="text-black flex items-center gap-1">
                <p>{url ? url.host : link.url}</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:group-hover/item:block duration-100 text-slate-500">
            <FontAwesomeIcon
              icon={faChevronRight}
              className="w-7 h-7 slide-right-with-fade"
            />
          </div>
        </div>
      </div>
    </a>
  );
}
