import React, { Dispatch, SetStateAction, useEffect } from "react";
import useLocalSettingsStore from "@/store/localSettings";
import { ViewMode } from "@/types/global";
import { dropdownTriggerer } from "@/lib/client/utils";
import { useTranslation } from "next-i18next";

type Props = {
  viewMode: ViewMode;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
};

export default function ViewDropdown({ viewMode, setViewMode }: Props) {
  const { settings, updateSettings } = useLocalSettingsStore((state) => state);
  const { t } = useTranslation();

  useEffect(() => {
    updateSettings({ viewMode });
  }, [viewMode, updateSettings]);

  const onChangeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    updateSettings({ viewMode });
  };

  const toggleShowSetting = (setting: keyof typeof settings.show) => {
    const newShowSettings = {
      ...settings.show,
      [setting]: !settings.show[setting],
    };
    updateSettings({ show: newShowSettings });
  };

  const onColumnsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ columns: Number(e.target.value) });
  };

  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        onMouseDown={dropdownTriggerer}
        className="btn btn-sm btn-square btn-ghost border-none"
      >
        {viewMode === ViewMode.Card ? (
          <i className="bi-grid w-4 h-4 text-neutral"></i>
        ) : viewMode === ViewMode.Masonry ? (
          <i className="bi-columns-gap w-4 h-4 text-neutral"></i>
        ) : (
          <i className="bi-view-stacked w-4 h-4 text-neutral"></i>
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[30] menu shadow bg-base-200 min-w-52 border border-neutral-content rounded-xl mt-1"
      >
        <p className="mb-1 text-sm text-neutral">{t("view")}</p>
        <div className="p-1 flex w-full justify-between gap-1 border border-neutral-content rounded-[0.625rem]">
          <button
            onClick={(e) => onChangeViewMode(ViewMode.Card)}
            className={`btn w-[31%] btn-sm btn-ghost ${
              viewMode === ViewMode.Card
                ? "bg-primary/20 hover:bg-primary/20"
                : "hover:bg-neutral/20"
            }`}
          >
            <i className="bi-grid text-lg text-neutral"></i>
          </button>
          <button
            onClick={(e) => onChangeViewMode(ViewMode.Masonry)}
            className={`btn w-[31%] btn-sm btn-ghost ${
              viewMode === ViewMode.Masonry
                ? "bg-primary/20 hover:bg-primary/20"
                : "hover:bg-neutral/20"
            }`}
          >
            <i className="bi-columns-gap text-lg text-neutral"></i>
          </button>
          <button
            onClick={(e) => onChangeViewMode(ViewMode.List)}
            className={`btn w-[31%] btn-sm btn-ghost ${
              viewMode === ViewMode.List
                ? "bg-primary/20 hover:bg-primary/20"
                : "hover:bg-neutral/20"
            }`}
          >
            <i className="bi-view-stacked text-lg text-neutral"></i>
          </button>
        </div>
        <p className="mb-1 mt-2 text-sm text-neutral">{t("show")}</p>
        {Object.entries(settings.show)
          .filter((e) =>
            settings.viewMode === ViewMode.List // Hide tags, image, and description checkboxes in list view
              ? e[0] !== "tags" && e[0] !== "image" && e[0] !== "description"
              : settings.viewMode === ViewMode.Card // Hide tags and description checkboxes in card view
                ? e[0] !== "tags" && e[0] !== "description"
                : true
          )
          .map(([key, value]) => (
            <li key={key}>
              <label className="label cursor-pointer flex justify-start">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={value}
                  onChange={() =>
                    toggleShowSetting(key as keyof typeof settings.show)
                  }
                />
                <span className="label-text whitespace-nowrap">{t(key)}</span>
              </label>
            </li>
          ))}
        {settings.viewMode !== ViewMode.List && (
          <>
            <p className="mb-1 mt-2 text-sm text-neutral">
              {t("columns")}:{" "}
              {settings.columns === 0 ? t("default") : settings.columns}
            </p>
            <div>
              <input
                type="range"
                min={0}
                max="8"
                value={settings.columns}
                onChange={(e) => onColumnsChange(e)}
                className="range range-xs range-primary"
                step="1"
              />
              <div className="flex w-full justify-between px-2 text-xs text-neutral select-none">
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
                <span>|</span>
              </div>
            </div>
          </>
        )}
      </ul>
    </div>
  );
}
