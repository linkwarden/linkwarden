import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SCROLLBAR_HIDE_DELAY = 1000;
const MIN_THUMB_HEIGHT = 24;

export default function SidebarScrollArea({
  children,
}: {
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const drag = useRef<{ startY: number; startScrollTop: number } | null>(null);

  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [thumb, setThumb] = useState({ top: 0, height: 0 });
  const [scrolling, setScrolling] = useState(false);
  const [thumbHovered, setThumbHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;

    setShowTopFade(el.scrollTop > 0);
    setShowBottomFade(el.scrollHeight - el.clientHeight - el.scrollTop > 1);

    if (el.scrollHeight <= el.clientHeight) {
      setThumb({ top: 0, height: 0 });
      return;
    }

    const height = Math.max(
      (el.clientHeight / el.scrollHeight) * el.clientHeight,
      MIN_THUMB_HEIGHT
    );

    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const scrollTop = Math.min(Math.max(el.scrollTop, 0), maxScrollTop);
    const top = (scrollTop / maxScrollTop) * (el.clientHeight - height);

    setThumb({ top, height });
  };

  const showScrollbar = () => {
    setScrolling(true);
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(
      () => setScrolling(false),
      SCROLLBAR_HIDE_DELAY
    );
  };

  const handleScroll = () => {
    updateScrollState();
    showScrollbar();
  };

  useEffect(() => {
    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    if (scrollRef.current) observer.observe(scrollRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      observer.disconnect();
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startScrollTop: el.scrollTop };
    setDragging(true);
  };

  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !drag.current) return;

    const trackRange = el.clientHeight - thumb.height;
    if (trackRange <= 0) return;

    const scrollRange = el.scrollHeight - el.clientHeight;
    el.scrollTop =
      drag.current.startScrollTop +
      ((e.clientY - drag.current.startY) * scrollRange) / trackRange;
  };

  const onThumbPointerUp = () => {
    drag.current = null;
    setDragging(false);
    showScrollbar();
  };

  const thumbVisible =
    thumb.height > 0 && (scrolling || thumbHovered || dragging);

  return (
    <div className="flex-1 min-h-0 relative mt-1">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-1 hide-scrollbar"
      >
        <div ref={contentRef}>{children}</div>
      </div>
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-base-200 to-transparent pointer-events-none transition-opacity duration-200",
          showTopFade ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-base-200 to-transparent pointer-events-none transition-opacity duration-200",
          showBottomFade ? "opacity-100" : "opacity-0"
        )}
      />
      {thumb.height > 0 && (
        <div
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={onThumbPointerUp}
          onPointerEnter={() => setThumbHovered(true)}
          onPointerLeave={() => setThumbHovered(false)}
          className={cn(
            "absolute right-0.5 w-1.5 rounded-full bg-base-content/30 hover:bg-base-content/50 touch-none transition-opacity duration-300",
            thumbVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          style={{ top: thumb.top, height: thumb.height }}
        />
      )}
    </div>
  );
}
