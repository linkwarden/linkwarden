import AdminSidebar from "@/components/AdminSidebar";
import Navbar from "@/components/Navbar";
import React, { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "next-i18next";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex" data-testid="admin-wrapper">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="lg:w-[calc(100%-320px)] w-full sm:pb-0 pb-20 flex flex-col h-screen overflow-y-auto">
        <Navbar admin />
        <div className="p-5 mx-auto w-full max-w-7xl">
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
