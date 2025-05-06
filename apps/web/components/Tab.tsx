import clsx from "clsx";
import { useLayoutEffect, useEffect, useRef, useState } from "react";

type Props = {
  tabs: { name?: string; icon?: string }[];
  activeTabIndex: number;
  setActiveTabIndex: (i: number) => void;
  className?: string;
  hideName?: boolean;
};

const Tab = ({
  tabs,
  activeTabIndex,
  setActiveTabIndex,
  className,
  hideName,
}: Props) => {
  const tabsRef = useRef<Array<HTMLElement | null>>([]);
  const [underline, setUnderline] = useState({ left: 0, width: 0 });
  const [transitionsOn, setTransitionsOn] = useState(false);

  // 1) Synchronously measure before paint whenever activeTabIndex changes
  useLayoutEffect(() => {
    const el = tabsRef.current[activeTabIndex];
    if (el) {
      setUnderline({
        left: el.offsetLeft,
        width: el.clientWidth,
      });
    }
  }, [activeTabIndex]);

  // 2) After the very first paint, turn transitions on (and never off again)
  useEffect(() => {
    setTransitionsOn(true);
  }, []);

  return (
    <div className={clsx("flex flex-row backdrop-blur-sm h-8 px-1", className)}>
      <span
        className={clsx(
          "absolute bottom-0 top-0 -z-10 flex overflow-hidden rounded-3xl py-1",
          transitionsOn && "duration-100 ease-out"
        )}
        style={{ left: underline.left, width: underline.width }}
      >
        <span className="h-full w-full rounded-3xl bg-primary/50" />
      </span>

      {tabs.map((tab, idx) => {
        const isActive = idx === activeTabIndex;
        return (
          <button
            key={idx}
            ref={(el) => {
              tabsRef.current[idx] = el;
            }}
            className={clsx(
              "my-auto cursor-pointer select-none rounded-full px-2 flex gap-1 items-center",
              !isActive && "hover:opacity-75 duration-100"
            )}
            onClick={() => setActiveTabIndex(idx)}
            title={tab.name}
          >
            {tab.icon && <i className={`text-lg ${tab.icon}`} />}
            {!hideName && tab.name && <span>{tab.name}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default Tab;
