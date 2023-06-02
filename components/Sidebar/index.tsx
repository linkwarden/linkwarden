import useCollectionStore from "@/store/collections";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faBox,
  faHashtag,
  faBookmark,
  faChartSimple,
} from "@fortawesome/free-solid-svg-icons";
import SidebarItem from "./SidebarItem";
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
    setActive(router.asPath);
  }, [router]);

  return (
    <div
      className={`bg-gray-100 h-screen w-64 xl:w-80 overflow-y-auto border-solid border-r-sky-100 px-2 border z-20 ${className}`}
    >
      <p className="p-3 text-sky-500 font-bold text-2xl my-2 leading-4">
        Linkwarden
      </p>

      <div className="flex flex-col gap-1">
        <Link href="/dashboard">
          <div
            className={`${
              active === "/dashboard"
                ? "bg-sky-500"
                : "hover:bg-slate-200 bg-gray-100"
            } outline-sky-100 outline-1 duration-100 py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faChartSimple}
              className={`w-4 h-4 ${
                active === "/dashboard" ? "text-white" : "text-sky-300"
              }`}
            />
            <p
              className={`${
                active === "/dashboard" ? "text-white" : "text-sky-900"
              }`}
            >
              Dashboard
            </p>
          </div>
        </Link>

        <Link href="/collections">
          <div
            className={`${
              active === "/collections" ? "bg-sky-500" : "hover:bg-slate-200"
            } outline-sky-100 outline-1 duration-100  py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faBox}
              className={`w-4 h-4 ${
                active === "/collections" ? "text-white" : "text-sky-300"
              }`}
            />
            <p
              className={`${
                active === "/collections" ? "text-white" : "text-sky-900"
              }`}
            >
              All Collections
            </p>
          </div>
        </Link>

        <Link href="/links">
          <div
            className={`${
              active === "/links"
                ? "bg-sky-500"
                : "hover:bg-slate-200 bg-gray-100"
            } outline-sky-100 outline-1 duration-100 py-1 px-2 rounded-md cursor-pointer flex items-center gap-2`}
          >
            <FontAwesomeIcon
              icon={faBookmark}
              className={`w-4 h-4 ${
                active === "/links" ? "text-white" : "text-sky-300"
              }`}
            />
            <p
              className={`${
                active === "/links" ? "text-white" : "text-sky-900"
              }`}
            >
              All Links
            </p>
          </div>
        </Link>
      </div>

      <div className="text-gray-500 mt-5">
        <p className="text-sm mb-2 pl-3 font-semibold">Collections</p>
      </div>
      <div className="flex flex-col gap-1">
        {collections
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((e, i) => {
            return (
              <SidebarItem
                key={i}
                text={e.name}
                icon={<FontAwesomeIcon icon={faFolder} />}
                iconColor={e.color}
                path={`/collections/${e.id}`}
                className="capitalize"
              />
            );
          })}
      </div>
      <div className="text-gray-500 mt-5">
        <p className="text-sm mb-2 pl-3 font-semibold">Tags</p>
      </div>
      <div className="flex flex-col gap-1">
        {tags
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((e, i) => {
            return (
              <SidebarItem
                key={i}
                text={e.name}
                icon={<FontAwesomeIcon icon={faHashtag} />}
                path={`/tags/${e.id}`}
              />
            );
          })}
      </div>
    </div>
  );
}
