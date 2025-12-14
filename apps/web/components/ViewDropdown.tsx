import useLocalSettingsStore from "@/store/localSettings";
import { ViewMode } from "@linkwarden/types";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

type Props = {
  viewMode: ViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
  dashboard?: boolean;
};

export default function ViewDropdown({
  viewMode,
  setViewMode,
  dashboard,
}: Props) {
  const { settings, updateSettings } = useLocalSettingsStore((s) => s);
  const { t } = useTranslation();

  useEffect(() => {
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
    if (!dashboard && settings.viewMode === ViewMode.List)
      return key !== "tags" && key !== "image" && key !== "description";
    if (dashboard || settings.viewMode === ViewMode.Card)
      return key !== "tags" && key !== "description";
    return true;
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("view_settings")}>
          {dashboard || viewMode === ViewMode.Card ? (
            <i className="bi-grid text-neutral"></i>
          ) : viewMode === ViewMode.Masonry ? (
            <i className="bi-columns-gap text-neutral"></i>
          ) : (
            <i className="bi-view-stacked text-neutral"></i>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent sideOffset={4} align="end" className="w-44 px-0">
        {!dashboard && (
          <>
            <p className="px-2 text-sm text-neutral mb-1">{t("view")}</p>
            <div className="px-4 flex gap-1 border-border" role="radiogroup">
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
                    role="radio"
                    aria-checked={viewMode === mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => onChangeViewMode(mode)}
                    aria-label={t(`${mode}_view`)}
                    className={cn(
                      "flex-1",
                      viewMode === mode
                        ? "bg-primary/20 hover:bg-primary/20"
                        : "hover:bg-neutral/20"
                    )}
                  >
                    <Icon />
                  </Button>
                );
              })}
            </div>
            <Separator className="my-1" />
          </>
        )}

        <p className="px-2 text-sm text-neutral mb-1">{t("show")}</p>
        {visibleShows.map((key) => (
          <div key={key} className="flex items-center gap-2 py-1.5 px-2">
            <Checkbox
              checked={settings.show[key]}
              id={key}
              onCheckedChange={() => {
                toggleShow(key);
              }}
            />
            <Label htmlFor={key} className="flex-1">
              {t(key)}
            </Label>
          </div>
        ))}

        {!dashboard && settings.viewMode !== ViewMode.List && (
          <>
            <Separator className="my-1" />

            <div className="px-2">
              <p className="text-sm text-neutral mb-1">
                {t("columns")}:{" "}
                {settings.columns === 0 ? t("default") : settings.columns}
              </p>
              <input
                type="range"
                aria-label={t("number_of_columns")}
                min={0}
                max={8}
                step={1}
                value={settings.columns}
                aria-valuemin={0}
                aria-valuemax={8}
                aria-valuenow={settings.columns}
                onChange={onColumnsChange}
                className="range range-xs range-primary w-full"
              />
              <div
                className="flex justify-between text-xs text-neutral select-none px-1"
                aria-hidden="true"
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i}>|</span>
                ))}
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
