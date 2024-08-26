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

  const onChangeViewMode = (
    e: React.MouseEvent<HTMLButtonElement>,
    mode: ViewMode
  ) => {
    setViewMode(mode);
  };

  const toggleShowSetting = (setting: keyof typeof settings.show) => {
    const newShowSettings = {
      ...settings.show,
      [setting]: !settings.show[setting],
    };
    updateSettings({ show: newShowSettings });
  };

  useEffect(() => {
    updateSettings({ viewMode });
  }, [viewMode, updateSettings]);

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
      <ul className="dropdown-content z-[30] menu shadow bg-base-200 min-w-52 border border-neutral-content rounded-xl mt-1">
        <p className="mb-1 text-sm text-neutral">{t("view")}</p>
        <div
          className="p-1 flex w-full justify-between gap-1 border border-neutral-content rounded-[0.625rem]"
          tabIndex={0}
          role="button"
        >
          <button
            onClick={(e) => onChangeViewMode(e, ViewMode.Card)}
            className={`btn btn-square btn-sm btn-ghost ${
              viewMode === ViewMode.Card
                ? "bg-primary/20 hover:bg-primary/20"
                : "hover:bg-neutral/20"
            }`}
          >
            <i className="bi-grid text-lg text-neutral"></i>
          </button>
          <button
            onClick={(e) => onChangeViewMode(e, ViewMode.Masonry)}
            className={`btn btn-square btn-sm btn-ghost ${
              viewMode === ViewMode.Masonry
                ? "bg-primary/20 hover:bg-primary/20"
                : "hover:bg-neutral/20"
            }`}
          >
            <i className="bi-columns-gap text-lg text-neutral"></i>
          </button>
          <button
            onClick={(e) => onChangeViewMode(e, ViewMode.List)}
            className={`btn btn-square btn-sm btn-ghost ${
              viewMode === ViewMode.List
                ? "bg-primary/20 hover:bg-primary/20"
                : "hover:bg-neutral/20"
            }`}
          >
            <i className="bi-view-stacked text-lg text-neutral"></i>
          </button>
        </div>
        <p className="my-1 text-sm text-neutral">{t("show")}</p>
        {Object.entries(settings.show)
          .filter((e) =>
            settings.viewMode === ViewMode.List // Hide tags and image checkbox in list view
              ? e[0] !== "tags" && e[0] !== "image"
              : settings.viewMode === ViewMode.Card // Hide tags checkbox in card view
                ? e[0] !== "tags"
                : true
          )
          .map(([key, value]) => (
            <li key={key}>
              <label
                className="label cursor-pointer flex justify-start"
                tabIndex={0}
                role="button"
              >
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
      </ul>
    </div>
  );
}
