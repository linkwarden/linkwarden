import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useLocalSettingsStore from "@/store/localSettings";
import { ViewMode } from "@linkwarden/types";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/Button";

type Props = {
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
};

export default function ViewDropdown({ viewMode, setViewMode }: Props) {
  const { settings, updateSettings } = useLocalSettingsStore((s) => s);
  const { t } = useTranslation();

  React.useEffect(() => {
    updateSettings({ viewMode });
  }, [viewMode, updateSettings]);

  const onChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    updateSettings({ viewMode: mode });
  };

  const toggleShow = (key: keyof typeof settings.show) => {
    updateSettings({
      show: { ...settings.show, [key]: !settings.show[key] },
    });
  };

  const onColumnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ columns: Number(e.target.value) });
  };

  const visibleShows = (
    Object.keys(settings.show) as (keyof typeof settings.show)[]
  ).filter((key) => {
    if (settings.viewMode === ViewMode.List)
      return key !== "tags" && key !== "image" && key !== "description";
    if (settings.viewMode === ViewMode.Card)
      return key !== "tags" && key !== "description";
    return true;
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {viewMode === ViewMode.Card ? (
            <i className="bi-grid text-neutral"></i>
          ) : viewMode === ViewMode.Masonry ? (
            <i className="bi-columns-gap text-neutral"></i>
          ) : (
            <i className="bi-view-stacked text-neutral"></i>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={4} align="end">
        <div className="px-1">
          <p className="text-sm text-neutral">{t("view")}</p>
          <div className="flex gap-1 border-border">
            {[ViewMode.Card, ViewMode.Masonry, ViewMode.List].map((mode) => {
              const Icon =
                mode === ViewMode.Card
                  ? () => <i className="bi-grid w-4 h-4 text-neutral" />
                  : mode === ViewMode.Masonry
                    ? () => (
                        <i className="bi-columns-gap w-4 h-4 text-neutral" />
                      )
                    : () => (
                        <i className="bi-view-stacked w-4 h-4 text-neutral" />
                      );

              return (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => onChangeViewMode(mode)}
                  className={
                    `flex-1 ` +
                    (viewMode === mode
                      ? "bg-primary/20 hover:bg-primary/20"
                      : "hover:bg-neutral/20")
                  }
                >
                  <Icon />
                </Button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        <p className="text-sm text-neutral px-1">{t("show")}</p>
        {visibleShows.map((key) => (
          <DropdownMenuCheckboxItem
            key={key}
            checked={settings.show[key]}
            onSelect={(e) => {
              e.preventDefault();
              toggleShow(key);
            }}
          >
            {t(key)}
          </DropdownMenuCheckboxItem>
        ))}

        {settings.viewMode !== ViewMode.List && (
          <>
            <DropdownMenuSeparator />

            <div className="px-1">
              <p className="text-sm text-neutral">
                {t("columns")}:{" "}
                {settings.columns === 0 ? t("default") : settings.columns}
              </p>
              <input
                type="range"
                min={0}
                max={8}
                step={1}
                value={settings.columns}
                onChange={onColumnsChange}
                className="range range-xs range-primary w-full"
              />
              <div className="flex justify-between text-xs text-neutral select-none px-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i}>|</span>
                ))}
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
