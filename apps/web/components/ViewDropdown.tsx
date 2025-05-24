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

  // helper to filter which show-settings to display
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
        <div className="btn btn-sm btn-square btn-ghost border-none">
          {viewMode === ViewMode.Card ? (
            <i className="bi-grid w-4 h-4 text-neutral"></i>
          ) : viewMode === ViewMode.Masonry ? (
            <i className="bi-columns-gap w-4 h-4 text-neutral"></i>
          ) : (
            <i className="bi-view-stacked w-4 h-4 text-neutral"></i>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent sideOffset={4} align="end">
        {/* View Mode Buttons */}
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
                <button
                  key={mode}
                  onClick={() => onChangeViewMode(mode)}
                  className={`flex-1 btn btn-sm btn-ghost ${
                    viewMode === mode
                      ? "bg-primary/20 hover:bg-primary/20"
                      : "hover:bg-neutral/20"
                  }`}
                >
                  <Icon />
                </button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Show Toggles */}
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

        {/* Columns Slider */}
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
