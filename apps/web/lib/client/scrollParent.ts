// What a list scrolls with: its nearest scrolling container, or the window on
// pages without one (like a public collection, which has no dashboard layout
// around it). The page itself scrolls the window, and the window, not the
// root element, gets its scroll events.
export const getScrollParent = (element: HTMLElement): HTMLElement | Window => {
  for (let el = element.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return window;
};

export const isWindow = (target: unknown): target is Window =>
  typeof window !== "undefined" && target === window;
