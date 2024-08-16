import Link from "next/link";

export default function SidebarHighlightLink({
  title,
  href,
  icon,
  active,
}: {
  title: string;
  href: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        title={title}
        className={`${
          active || false
            ? "bg-primary/20"
            : "bg-neutral-content/20 hover:bg-neutral/20"
        } duration-200 px-3 py-2 cursor-pointer gap-2 w-full rounded-lg capitalize`}
      >
        <div
          className={
            "w-10 h-10 inline-flex items-center justify-center bg-black/10 dark:bg-white/5 rounded-full"
          }
        >
          <i className={`${icon} text-primary text-2xl drop-shadow`}></i>
        </div>
        <div className={"mt-1"}>
          <p className="truncate w-full font-semibold text-xs">{title}</p>
        </div>
      </div>
    </Link>
  );
}
