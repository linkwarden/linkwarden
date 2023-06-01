import {
  faArrowUpRightFromSquare,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { Link as LinkType } from "@prisma/client";

type Props = {
  link: Omit<LinkType, "screenshotPath" | "pdfPath">;
  count: number;
};

export default function ({ link, count }: Props) {
  const url = new URL(link.url);
  const formattedDate = new Date(
    link.createdAt as unknown as string
  ).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <a href={link.url} target="_blank" className="rounded-3xl">
      <div className="bg-gradient-to-tr from-slate-200 from-10% to-gray-50 via-20% shadow-md sm:hover:shadow-none duration-100 rounded-3xl cursor-pointer p-5 flex items-start relative gap-5 sm:gap-10 group/item">
        <Image
          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url.origin}&size=32`}
          width={42}
          height={42}
          alt=""
          className="select-none mt-3 z-10 rounded-full shadow border-[3px] border-white bg-white"
          draggable="false"
          onError={(e) => {
            const target = e.target as HTMLElement;
            target.style.opacity = "0";
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
            target.style.opacity = "0";
          }}
        />
        <div className="flex justify-between items-center gap-5 w-full h-full z-0">
          <div className="flex flex-col justify-between">
            <div className="flex items-baseline gap-1">
              <p className="text-sm text-sky-300 font-bold">{count + 1}.</p>
              <p className="text-lg text-sky-600  font-bold">{link.name}</p>
            </div>

            <p className="text-sky-400 text-sm font-medium">{link.title}</p>

            <div className="flex gap-2 items-center flex-wrap mt-2">
              <p className="text-gray-500">{formattedDate}</p>
              <div className="text-gray-500 font-bold flex items-center gap-1">
                <p>{url.host}</p>
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="w-3 opacity-0 group-hover/item:opacity-100 duration-75"
                />
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
