import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

type Props = {
  tabs: { name?: string; icon?: string }[];
  activeTabIndex: number;
  setActiveTabIndex: Function;
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
  const tabsRef = useRef<(HTMLElement | null)[]>([]);
  const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
  const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstRender(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTabIndex === null) {
      return;
    }

    const setTabPosition = () => {
      const currentTab = tabsRef.current[activeTabIndex] as HTMLElement;
      setTabUnderlineLeft(currentTab?.offsetLeft ?? 0);
      setTabUnderlineWidth(currentTab?.clientWidth ?? 0);
    };

    setTabPosition();
  }, [activeTabIndex]);

  return (
    <div className={clsx("flew-row flex backdrop-blur-sm h-8 px-1", className)}>
      <span
        className={`absolute bottom-0 top-0 -z-10 flex overflow-hidden rounded-3xl py-1 ${
          isFirstRender ? "" : "duration-100"
        }`}
        style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
      >
        <span className="h-full w-full rounded-3xl bg-primary/50" />
      </span>
      {tabs.map((tab, index) => {
        const isActive = activeTabIndex === index;
        return (
          <button
            key={index}
            ref={(el) => {
              tabsRef.current[index] = el;
            }}
            className={`${
              isActive ? `` : `hover:opacity-75 duration-100`
            } my-auto cursor-pointer select-none rounded-full px-2 text-center flex gap-1 items-center`}
            onClick={() => setActiveTabIndex(index)}
            title={tab.name}
          >
            {tab.icon && <i className={`text-lg ${tab.icon}`}></i>}
            {!hideName && tab.name && <p>{tab.name}</p>}
          </button>
        );
      })}
    </div>
  );
};

export default Tab;
