import { useTranslation } from "next-i18next";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateUserPreference, useUser } from "@linkwarden/router/user";
import { Theme } from "@linkwarden/prisma/client";

type Props = {
  hideInMobile?: boolean;
};

const themes: { value: Theme; icon: string }[] = [
  { value: "light", icon: "bi-sun-fill" },
  { value: "dark", icon: "bi-moon-fill" },
  { value: "auto", icon: "bi-circle-half" },
];

export default function ToggleDarkMode({ hideInMobile }: Props) {
  const { t } = useTranslation();
  const { data } = useUser();
  const updateUserPreference = useUpdateUserPreference();

  const getIcon = () => {
    switch (data?.theme) {
      case "light":
        return "bi-sun-fill";
      case "dark":
        return "bi-moon-fill";
      case "auto":
        return "bi-circle-half";
      default:
        return "bi-moon-fill";
    }
  };

  if (!data?.theme) return <></>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={hideInMobile ? "hidden sm:inline-grid" : ""}
      >
        <Button variant="ghost" size="icon" className="text-neutral">
          <i className={`${getIcon()} text-xl`}></i>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => updateUserPreference.mutateAsync({ theme: value })}
            className="gap-2"
          >
            <i className={`${icon} text-lg`}></i>
            <span>{t(value)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
