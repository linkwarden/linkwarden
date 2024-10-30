export function isPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes("android-app://")
  );
}

export function isIphone() {
  return (
    /iPhone/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: any }).MSStream
  );
}

export function dropdownTriggerer(
  e: React.FocusEvent<HTMLElement> | React.MouseEvent<HTMLElement>
) {
  let targetEl = e.currentTarget;
  if (targetEl && targetEl.matches(":focus")) {
    setTimeout(function () {
      targetEl.blur();
    }, 0);
  }
}

import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));
