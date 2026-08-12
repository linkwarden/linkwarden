import { useTranslation } from "next-i18next";
import { useUser } from "@linkwarden/router/user";
import { useConfig } from "@linkwarden/router/config";
import SecondarySidebar, {
  SecondarySidebarLink,
} from "@/components/SecondarySidebar";

export default function SettingsSidebar({
  className,
  toggleSidebar,
  sidebarIsCollapsed,
}: {
  className?: string;
  toggleSidebar?: () => void;
  sidebarIsCollapsed?: boolean;
}) {
  const { t } = useTranslation();
  const { data: user } = useUser();
  const { data: config } = useConfig();

  const links: SecondarySidebarLink[] = [
    {
      title: t("account"),
      href: "/settings/account",
      icon: "bi-person",
    },
    {
      title: t("preference"),
      href: "/settings/preference",
      icon: "bi-sliders",
    },
    {
      title: "RSS Subscriptions",
      href: "/settings/rss-subscriptions",
      icon: "bi-rss",
    },
    {
      title: t("access_tokens"),
      href: "/settings/access-tokens",
      icon: "bi-key",
    },
    {
      title: t("password"),
      href: "/settings/password",
      icon: "bi-lock",
    },
  ];

  if (config?.STRIPE_ENABLED && !user?.parentSubscriptionId) {
    links.push({
      title: t("billing"),
      href: "/settings/billing",
      icon: "bi-credit-card",
    });
  }

  return (
    <SecondarySidebar
      className={className}
      toggleSidebar={toggleSidebar}
      sidebarIsCollapsed={sidebarIsCollapsed}
      links={links}
    />
  );
}
