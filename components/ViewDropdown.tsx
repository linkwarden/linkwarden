import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import useLocalSettingsStore from "@/store/localSettings";

import {ViewMode} from "@/types/global";

type Props = {
    viewMode: string;
    setViewMode: Dispatch<SetStateAction<string>>;
};

export default function ViewDropdown({viewMode, setViewMode}: Props) {
    const {updateSettings} = useLocalSettingsStore();

    const onChangeViewMode = (e: React.MouseEvent<HTMLButtonElement>, viewMode: ViewMode) => {
        setViewMode(viewMode);
    }

    useEffect(() => {
        updateSettings({viewMode: viewMode as ViewMode});
    }, [viewMode]);

    return (
        <div className="p-1 flex flex-row gap-0.5 border border-neutral-content rounded-md">
            <button
                onClick={(e) => onChangeViewMode(e, ViewMode.Default)}
                className={`p-2 rounded-md ${
                    viewMode == ViewMode.Default ? "bg-primary/20" : "hover:bg-neutral/20"
                }`}
            >
                <svg
                    className="w-4 h-4 text-neutral"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M10.93,14.44v5.45a1.38,1.38,0,0,1-1.37,1.37H4.11a1.38,1.38,0,0,1-1.37-1.37V14.44a1.38,1.38,0,0,1,1.37-1.37H9.56A1.38,1.38,0,0,1,10.93,14.44ZM9.56,2.74H4.11A1.38,1.38,0,0,0,2.74,4.11V9.56a1.38,1.38,0,0,0,1.37,1.37H9.56a1.38,1.38,0,0,0,1.37-1.37V4.11A1.38,1.38,0,0,0,9.56,2.74Zm11.7,17.15V14.44a1.38,1.38,0,0,0-1.37-1.37H14.44a1.38,1.38,0,0,0-1.37,1.37v5.45a1.38,1.38,0,0,0,1.37,1.37h5.45A1.38,1.38,0,0,0,21.26,19.89Zm0-10.33V4.11a1.38,1.38,0,0,0-1.37-1.37H14.44a1.38,1.38,0,0,0-1.37,1.37V9.56a1.38,1.38,0,0,0,1.37,1.37h5.45A1.38,1.38,0,0,0,21.26,9.56Z"/>
                </svg>
            </button>
            <button
                onClick={(e) => onChangeViewMode(e, ViewMode.Compact)}
                className={`p-2 rounded-md ${
                    viewMode == ViewMode.Compact ? "bg-primary/20" : "hover:bg-neutral/20"
                }`}
            >
                <svg
                    className="w-4 h-4 text-neutral"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M14.34,11V13A1.37,1.37,0,0,1,13,14.34H11A1.37,1.37,0,0,1,9.66,13V11A1.37,1.37,0,0,1,11,9.66H13A1.37,1.37,0,0,1,14.34,11ZM13,2.74H11A1.37,1.37,0,0,0,9.66,4.11V6.06A1.37,1.37,0,0,0,11,7.43H13a1.37,1.37,0,0,0,1.37-1.37V4.11A1.37,1.37,0,0,0,13,2.74ZM21.26,13V11a1.37,1.37,0,0,0-1.37-1.37H17.94A1.37,1.37,0,0,0,16.57,11V13a1.37,1.37,0,0,0,1.37,1.37h1.95A1.37,1.37,0,0,0,21.26,13ZM11,21.26H13a1.37,1.37,0,0,0,1.37-1.37V17.94A1.37,1.37,0,0,0,13,16.57H11a1.37,1.37,0,0,0-1.37,1.37v1.95A1.37,1.37,0,0,0,11,21.26ZM2.74,11V13a1.37,1.37,0,0,0,1.37,1.37H6.06A1.37,1.37,0,0,0,7.43,13V11A1.37,1.37,0,0,0,6.06,9.66H4.11A1.37,1.37,0,0,0,2.74,11Zm18.52-5V4.11a1.38,1.38,0,0,0-1.37-1.37H17.94a1.38,1.38,0,0,0-1.37,1.37V6.06a1.38,1.38,0,0,0,1.37,1.37h1.95A1.38,1.38,0,0,0,21.26,6.06ZM2.74,4.11V6.06A1.38,1.38,0,0,0,4.11,7.43H6.06A1.38,1.38,0,0,0,7.43,6.06V4.11A1.38,1.38,0,0,0,6.06,2.74H4.11A1.38,1.38,0,0,0,2.74,4.11ZM21.26,19.89V17.94a1.38,1.38,0,0,0-1.37-1.37H17.94a1.38,1.38,0,0,0-1.37,1.37v1.95a1.38,1.38,0,0,0,1.37,1.37h1.95A1.38,1.38,0,0,0,21.26,19.89ZM2.74,17.94v1.95a1.38,1.38,0,0,0,1.37,1.37H6.06a1.38,1.38,0,0,0,1.37-1.37V17.94a1.38,1.38,0,0,0-1.37-1.37H4.11A1.38,1.38,0,0,0,2.74,17.94Z"/>
                </svg>
            </button>
            <button
                onClick={(e) => onChangeViewMode(e, ViewMode.List)}
                className={`p-2 rounded-md ${
                    viewMode == ViewMode.List ? "bg-primary/20" : "hover:bg-neutral/20"
                }`}
            >
                <svg
                    className="w-4 h-4 text-neutral"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M5.36,5A1.76,1.76,0,1,1,3.6,3.26,1.76,1.76,0,0,1,5.36,5ZM20.78,3.48H8.6A1.37,1.37,0,0,0,7.22,4.85v.33A1.37,1.37,0,0,0,8.6,6.55H20.78a1.37,1.37,0,0,0,1.37-1.37V4.85A1.37,1.37,0,0,0,20.78,3.48ZM3.6,10.24A1.76,1.76,0,1,0,5.36,12,1.75,1.75,0,0,0,3.6,10.24Zm17.18.22H8.6a1.38,1.38,0,0,0-1.38,1.37v.34A1.38,1.38,0,0,0,8.6,13.54H20.78a1.37,1.37,0,0,0,1.37-1.37v-.34A1.37,1.37,0,0,0,20.78,10.46ZM3.6,17.23A1.76,1.76,0,1,0,5.36,19,1.75,1.75,0,0,0,3.6,17.23Zm17.18.22H8.6a1.37,1.37,0,0,0-1.38,1.37v.33A1.37,1.37,0,0,0,8.6,20.52H20.78a1.37,1.37,0,0,0,1.37-1.37v-.33A1.37,1.37,0,0,0,20.78,17.45Z"/>
                </svg>
            </button>
        </div>
    );
}
