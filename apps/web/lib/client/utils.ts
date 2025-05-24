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

import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...classes: ClassValue[]) => twMerge(clsx(...classes));
