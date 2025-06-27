import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
