import { isPWA } from "@/lib/client/utils";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function MobileNavigationButton({
  href,
  icon,
}: {
  href: string;
  icon: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(href === router.asPath);
  }, [router]);

  return (
    <Link
      href={href}
      className="w-full active:scale-[80%] duration-200 select-none"
      draggable="false"
      style={{ WebkitTouchCallout: "none" }}
      onContextMenu={(e) => {
        if (isPWA()) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        } else return null;
      }}
    >
      <div
        className={`py-2 cursor-pointer gap-2 w-full rounded-full capitalize flex items-center justify-center`}
      >
        <i
          className={`${icon} text-primary text-3xl drop-shadow duration-200 rounded-full w-14 h-14 text-center pt-[0.65rem] ${
            active || false ? "bg-primary/20" : ""
          }`}
        ></i>
      </div>
    </Link>
  );
}
