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
          active || false ? "bg-primary/20" : "hover:bg-neutral/20"
        } duration-200 px-3 py-1 cursor-pointer flex items-center gap-2 w-full rounded-lg capitalize`}
      >
        <i className={`${icon} text-primary text-xl drop-shadow`}></i>
        <p className="truncate w-full font-semibold text-sm">{title}</p>
      </div>
    </Link>
  );
}
