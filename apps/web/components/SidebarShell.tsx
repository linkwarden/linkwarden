import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ActionIcon({
  icon,
  label,
  onClick,
  variant = "metal",
  tooltipSide,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  variant?:
    | "metal"
    | "link"
    | "default"
    | "primary"
    | "accent"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "simple";
  tooltipSide?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onClick}
            aria-label={label}
          >
            <i className={cn(icon, "text-lg leading-none")} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type SidebarShellContext = {
  collapsed?: boolean;
  toggle?: () => void;
  closeMobileSidebar: () => void;
};

export default function SidebarShell({
  className,
  toggleSidebar,
  sidebarIsCollapsed,
  children,
}: {
  className?: string;
  toggleSidebar?: () => void;
  sidebarIsCollapsed?: boolean;
  children: (ctx: SidebarShellContext) => ReactNode;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    setMobileExpanded(false);
  }, [router.asPath]);

  const collapsed = isMobile ? !mobileExpanded : sidebarIsCollapsed;
  const toggle = isMobile
    ? () => setMobileExpanded(!mobileExpanded)
    : toggleSidebar;

  return (
    <>
      {isMobile && mobileExpanded && (
        <>
          <div className="w-14 shrink-0" />
          <div
            className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm z-30 fade-in"
            onClick={() => setMobileExpanded(false)}
          />
        </>
      )}
      <div
        id="sidebar"
        className={cn(
          "bg-base-200 h-screen flex flex-col border-solid border border-base-200 border-r-neutral-content z-20",
          className,
          collapsed ? "p-2 w-14" : "p-1 w-72",
          isMobile &&
            mobileExpanded &&
            "p-2 fixed inset-y-0 left-0 z-40 shadow-lg"
        )}
      >
        {children({
          collapsed,
          toggle,
          closeMobileSidebar: () => setMobileExpanded(false),
        })}

        <div
          className={cn(
            "shrink-0 flex items-center gap-2 p-1 mt-1",
            collapsed ? "flex-col" : "justify-between relative"
          )}
        >
          {collapsed ? (
            <ProfileDropdown
              tooltipSide="right"
              dropdownSide="right"
              dropdownAlign="end"
            />
          ) : (
            <div className="min-w-0 flex-1">
              <ProfileDropdown showName />
            </div>
          )}

          {toggle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" onClick={toggle} size="icon">
                    <i className="bi-layout-sidebar" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>
                  {collapsed ? t("expand_sidebar") : t("shrink_sidebar")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </>
  );
}
