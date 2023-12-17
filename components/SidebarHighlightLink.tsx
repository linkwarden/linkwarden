import Link from "next/link";

export default function SidebarHighlightLink({ title, href, icon, active }: {
  title: string,
  href: string,
  icon: string,
  active?: boolean
}) {

  return (
    <Link href={href}>
      <div
        className={`${
          active || false ? "bg-primary/20" : "bg-white/5 hover:bg-neutral/20"
        } duration-100 px-3 py-2 cursor-pointer gap-2 w-full rounded-lg capitalize`}
      >
        <div className={"w-8 h-8 inline-flex items-center justify-center bg-white/5 rounded-full"}>
          <i className={`${icon} text-primary text-xl drop-shadow`}></i>
        </div>
        <div className={"mt-1"}>
          <p className="truncate w-full text-xs sm:text-sm">{title}</p>
        </div>
      </div>
    </Link>
  )
}