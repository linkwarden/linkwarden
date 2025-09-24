import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SidebarHighlightLink({
  title,
  href,
  icon,
  active,
  sidebarIsCollapsed,
}: {
  title: string;
  href: string;
  icon: string;
  active?: boolean;
  sidebarIsCollapsed?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} title={title}>
            <div
              className={cn(
                active ? "bg-primary/20" : "hover:bg-neutral/20",
                "duration-200 cursor-pointer flex items-center gap-2 capitalize",
                sidebarIsCollapsed
                  ? "rounded-md h-8 w-8"
                  : "rounded-lg px-3 py-1"
              )}
            >
              <i
                className={cn(
                  icon,
                  "text-primary text-xl drop-shadow",
                  sidebarIsCollapsed && "w-full text-center"
                )}
              ></i>
              {!sidebarIsCollapsed && (
                <p className="truncate w-full font-semibold text-sm">{title}</p>
              )}
            </div>
          </Link>
        </TooltipTrigger>
        {sidebarIsCollapsed && (
          <TooltipContent side="right">{title}</TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
