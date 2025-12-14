// adopted from https://github.com/paulcollett/react-masonry-css/blob/master/src/react-masonry-css.js

import React, { useState, useEffect, useCallback, useMemo } from "react";

const DEFAULT_COLUMNS = 2;

interface MasonryProps {
  breakpointCols?: number | { default: number; [key: number]: number };
  className?: string;
  columnClassName?: string;
  children?: React.ReactNode;
  columnAttrs?: React.HTMLAttributes<HTMLUListElement>;
  column?: React.HTMLAttributes<HTMLUListElement>;
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}

const Masonry = ({
  breakpointCols,
  className,
  columnClassName,
  children,
  columnAttrs = {},
  column,
  ...rest
}: MasonryProps) => {
  const [columnCount, setColumnCount] = useState(() => {
    if (
      breakpointCols &&
      typeof breakpointCols === "object" &&
      breakpointCols.default
    ) {
      return breakpointCols.default;
    }
    return parseInt(String(breakpointCols)) || DEFAULT_COLUMNS;
  });

  const reCalculateColumnCount = useCallback(() => {
    const windowWidth =
      typeof window !== "undefined" ? window.innerWidth : Infinity;
    let breakpointColsObject = breakpointCols;

    // Allow passing a single number to `breakpointCols` instead of an object
    if (typeof breakpointColsObject !== "object") {
      breakpointColsObject = {
        default: parseInt(String(breakpointColsObject)) || DEFAULT_COLUMNS,
      };
    }

    let matchedBreakpoint = Infinity;
    let columns = (breakpointColsObject as any).default || DEFAULT_COLUMNS;

    for (let breakpoint in breakpointColsObject as any) {
      const optBreakpoint = parseInt(breakpoint);
      const isCurrentBreakpoint =
        optBreakpoint > 0 && windowWidth <= optBreakpoint;

      if (isCurrentBreakpoint && optBreakpoint < matchedBreakpoint) {
        matchedBreakpoint = optBreakpoint;
        columns = (breakpointColsObject as any)[breakpoint];
      }
    }

    columns = Math.max(1, parseInt(String(columns)) || 1);

    if (columnCount !== columns) {
      setColumnCount(columns);
    }
  }, [breakpointCols, columnCount]);

  const lastRecalculateAnimationFrameRef = React.useRef<number>();

  const reCalculateColumnCountDebounce = useCallback(() => {
    if (typeof window === "undefined" || !window.requestAnimationFrame) {
      reCalculateColumnCount();
      return;
    }

    if (
      window.cancelAnimationFrame &&
      lastRecalculateAnimationFrameRef.current
    ) {
      window.cancelAnimationFrame(lastRecalculateAnimationFrameRef.current);
    }

    lastRecalculateAnimationFrameRef.current = window.requestAnimationFrame(
      () => {
        reCalculateColumnCount();
      }
    );
  }, [reCalculateColumnCount]);

  useEffect(() => {
    reCalculateColumnCount();

    // window may not be available in some environments
    if (typeof window !== "undefined") {
      window.addEventListener("resize", reCalculateColumnCountDebounce);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", reCalculateColumnCountDebounce);
      }
    };
  }, [reCalculateColumnCount, reCalculateColumnCountDebounce]);

  const renderColumns = useMemo(() => {
    const allItems = React.Children.toArray(children);

    return (
      <ul
        {...columnAttrs}
        className={columnClassName}
        style={{
          ...columnAttrs?.style,
          columnCount: columnCount,
          columnGap: "1.25rem",
        }}
      >
        {allItems.map((item: React.ReactNode, index: number) => (
          <li
            key={index}
            style={{ breakInside: "avoid", marginBottom: "1.25rem" }}
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }, [children, columnCount, columnClassName, columnAttrs]);

  let classNameOutput = className;

  return (
    <div {...rest} className={classNameOutput}>
      {renderColumns}
    </div>
  );
};

export default Masonry;
