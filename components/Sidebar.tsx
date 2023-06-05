import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faBox,
  faHashtag,
  faBookmark,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import useTagStore from "@/store/tags";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ({ className }: { className?: string }) {
  const { collections } = useCollectionStore();
  const { tags } = useTagStore();

  const router = useRouter();

  const [active, setActive] = useState("");

  useEffect(() => {
    console.log(window.location.hash);
    setActive(router.asPath);
  }, [router, collections]);

  return (
    <div
      className={`bg-gray-100 h-screen w-64 xl:w-80 overflow-y-auto border-solid border-r-sky-100 px-2 border z-20 ${className}`}
    >
      <p className="p-2 text-sky-500 font-bold text-2xl my-2 leading-4">
        Linkwarden
      </p>

      <div className="flex flex-col gap-1">
        <Link href="/dashboard">
          <div
            className={`${
              active === "/dashboard"
                ? "bg-sky-200"
                : "hover:bg-slate-200 bg-gray-100"
            } outline-sky-100 outline-1 duration-100 py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faChartSimple}
              className={`w-6 h-6 drop-shadow text-sky-500`}
            />
            <p className="text-sky-600">Dashboard</p>
          </div>
        </Link>

        <Link href="/collections">
          <div
            className={`${
              active === "/collections" ? "bg-sky-200" : "hover:bg-slate-200"
            } outline-sky-100 outline-1 duration-100  py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faBox}
              className={`w-6 h-6 drop-shadow text-sky-500`}
            />
            <p className="text-sky-600">All Collections</p>
          </div>
        </Link>

        <Link href="/links">
          <div
            className={`${
              active === "/links"
                ? "bg-sky-200"
                : "hover:bg-slate-200 bg-gray-100"
            } outline-sky-100 outline-1 duration-100 py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faBookmark}
              className={`w-6 h-6 drop-shadow text-sky-500`}
            />
            <p className="text-sky-600">All Links</p>
          </div>
        </Link>
      </div>

      <div className="text-gray-500 mt-5">
        <p className="text-sm mb-2 pl-2 font-semibold">Collections</p>
      </div>
      <div className="flex flex-col gap-1">
        {collections
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((e, i) => {
            return (
              <Link key={i} href={`/collections/${e.id}`}>
                <div
                  className={`${
                    active === `/collections/${e.id}`
                      ? "bg-sky-200"
                      : "hover:bg-slate-200 bg-gray-100"
                  } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8 capitalize`}
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    className="w-6 h-6 drop-shadow"
                    style={{ color: e.color }}
                  />

                  <p className="text-sky-600 truncate w-4/6">{e.name}</p>
                </div>
              </Link>
            );
          })}
      </div>
      <div className="text-gray-500 mt-5">
        <p className="text-sm mb-2 pl-2 font-semibold">Tags</p>
      </div>
      <div className="flex flex-col gap-1">
        {tags
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((e, i) => {
            return (
              <Link key={i} href={`/tags/${e.id}`}>
                <div
                  className={`${
                    active === `/tags/${e.id}`
                      ? "bg-sky-200"
                      : "hover:bg-slate-200 bg-gray-100"
                  } duration-100 py-1 px-2 cursor-pointer flex items-center gap-2 w-full rounded-md h-8`}
                >
                  <FontAwesomeIcon
                    icon={faHashtag}
                    className="w-4 h-4 text-sky-500 mt-1"
                  />

                  <p className="text-sky-600 truncate w-4/6">{e.name}</p>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
