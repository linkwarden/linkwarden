import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import SidebarShell, { ActionIcon } from "@/components/SidebarShell";
import SidebarScrollArea from "@/components/SidebarScrollArea";
import SidebarHighlightLink from "@/components/SidebarHighlightLink";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type SecondarySidebarLink = {
  title: string;
  href: string;
  icon: string;
};

export default function SecondarySidebar({
  links,
  className,
  toggleSidebar,
  sidebarIsCollapsed,
}: {
  links: SecondarySidebarLink[];
  className?: string;
  toggleSidebar?: () => void;
  sidebarIsCollapsed?: boolean;
}) {
  const { t } = useTranslation();

  const router = useRouter();
  const [active, setActive] = useState("");

  useEffect(() => {
    setActive(router.asPath);
  }, [router]);

  return (
    <SidebarShell
      className={className}
      toggleSidebar={toggleSidebar}
      sidebarIsCollapsed={sidebarIsCollapsed}
    >
      {({ collapsed }) => {
        const navLinks = (
          <div className={cn("flex flex-col gap-2", collapsed && "gap-3")}>
            {links.map((link) => (
              <SidebarHighlightLink
                key={link.href}
                title={link.title}
                href={link.href}
                icon={link.icon}
                active={active === link.href}
                sidebarIsCollapsed={collapsed}
              />
            ))}
          </div>
        );

        return (
          <>
            {collapsed ? (
              <div className="flex flex-col items-center shrink-0">
                <ActionIcon
                  icon="bi-chevron-left"
                  variant="ghost"
                  label={t("back_to_dashboard")}
                  tooltipSide="right"
                  onClick={() => router.push("/dashboard")}
                />
              </div>
            ) : (
              <div className="shrink-0 pt-1 px-1">
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="justify-start w-full h-8"
                >
                  <Link href="/dashboard">
                    <i className="bi-chevron-left text-md" />
                    <p>{t("back_to_dashboard")}</p>
                  </Link>
                </Button>
              </div>
            )}

            {collapsed ? (
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                {navLinks}
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto mt-1 p-1">
                {navLinks}
              </div>
            )}
          </>
        );
      }}
    </SidebarShell>
  );
}
