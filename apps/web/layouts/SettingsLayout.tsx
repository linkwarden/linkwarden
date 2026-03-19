import SettingsSidebar from "@/components/SettingsSidebar";
import Navbar from "@/components/Navbar";
import React, { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";

interface Props {
  children: ReactNode;
}

export default function SettingsLayout({ children }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex" data-testid="settings-wrapper">
      <div className="hidden lg:block">
        <SettingsSidebar />
      </div>

      <div className="lg:w-[calc(100%-320px)] w-full sm:pb-0 pb-20 flex flex-col h-screen overflow-y-auto">
        <Navbar settings />
        <div className="p-3 mx-auto w-full max-w-3xl min-[2000px]:max-w-6xl">
          <div className="gap-2 mb-3">
            <Button asChild variant="ghost" size="sm" className="text-neutral">
              <Link href="/dashboard">
                <i className="bi-chevron-left text-md" />
                <p>{t("back_to_dashboard")}</p>
              </Link>
            </Button>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
