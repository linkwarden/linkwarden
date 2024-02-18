import React, { Dispatch, SetStateAction, useEffect } from "react";
import useLocalSettingsStore from "@/store/localSettings";

import { ViewMode } from "@/types/global";

type Props = {
  viewMode: string;
  setViewMode: Dispatch<SetStateAction<string>>;
};

export default function ViewDropdown({ viewMode, setViewMode }: Props) {
  const { updateSettings } = useLocalSettingsStore();

  const onChangeViewMode = (
    e: React.MouseEvent<HTMLButtonElement>,
    viewMode: ViewMode
  ) => {
    setViewMode(viewMode);
  };

  useEffect(() => {
    updateSettings({ viewMode: viewMode as ViewMode });
  }, [viewMode]);

  return (
    <div className="p-1 flex flex-row gap-1 border border-neutral-content rounded-[0.625rem]">
      <button
        onClick={(e) => onChangeViewMode(e, ViewMode.Card)}
        className={`btn btn-square btn-sm btn-ghost ${
          viewMode == ViewMode.Card
            ? "bg-primary/20 hover:bg-primary/20"
            : "hover:bg-neutral/20"
        }`}
      >
        <i className="bi-grid w-4 h-4 text-neutral"></i>
      </button>

      <button
        onClick={(e) => onChangeViewMode(e, ViewMode.List)}
        className={`btn btn-square btn-sm btn-ghost ${
          viewMode == ViewMode.List
            ? "bg-primary/20 hover:bg-primary/20"
            : "hover:bg-neutral/20"
        }`}
      >
        <i className="bi bi-view-stacked w-4 h-4 text-neutral"></i>
      </button>

      {/* <button
        onClick={(e) => onChangeViewMode(e, ViewMode.Grid)}
        className={`btn btn-square btn-sm btn-ghost ${
          viewMode == ViewMode.Grid
            ? "bg-primary/20 hover:bg-primary/20"
            : "hover:bg-neutral/20"
        }`}
      >
        <i className="bi-columns-gap w-4 h-4 text-neutral"></i>
      </button> */}
    </div>
  );
}
