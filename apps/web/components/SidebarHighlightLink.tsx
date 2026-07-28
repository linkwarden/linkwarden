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
  external,
  sidebarIsCollapsed,
  expanded,
  onToggleExpand,
}: {
  title: string;
  href: string;
  icon: string;
  active?: boolean;
  external?: boolean;
  sidebarIsCollapsed?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const showToggle = Boolean(onToggleExpand) && !sidebarIsCollapsed;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            title={title}
            target={external ? "_blank" : undefined}
          >
            <div
              className={cn(
                active ? "bg-primary/20" : "hover:bg-neutral/20",
                "group transition-colors cursor-pointer flex items-center gap-2 capitalize",
                sidebarIsCollapsed ? "rounded-md h-8 w-8" : "rounded-lg px-3"
              )}
            >
              {sidebarIsCollapsed ? (
                <i
                  className={cn(
                    icon,
                    "text-primary text-lg drop-shadow w-full text-center"
                  )}
                ></i>
              ) : (
                <span className="relative flex items-center shrink-0">
                  <i
                    className={cn(
                      icon,
                      "text-primary text-lg drop-shadow",
                      showToggle && "group-hover:opacity-0 duration-100"
                    )}
                  ></i>
                  {showToggle && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onToggleExpand?.();
                      }}
                      aria-expanded={expanded}
                      className="absolute inset-0 hidden group-hover:flex items-center justify-center"
                    >
                      <i
                        className={cn(
                          expanded
                            ? "bi-caret-down-fill"
                            : "bi-caret-right-fill",
                          "opacity-50 hover:opacity-100 duration-200"
                        )}
                      ></i>
                    </button>
                  )}
                </span>
              )}
              {!sidebarIsCollapsed && (
                <p className="truncate w-full font-bold text-xs">{title}</p>
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
