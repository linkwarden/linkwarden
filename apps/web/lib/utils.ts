import { pointerWithin, rectIntersection } from "@dnd-kit/core";
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

/**
 *
 * Custom collision detection algorithm for dnd-kit that first checks for pointer collisions
 * and then falls back to rectangle intersections
 */
export function customCollisionDetectionAlgorithm(args: any) {
  // First, let's see if there are any collisions with the pointer
  const pointerCollisions = pointerWithin(args);

  // Collision detection algorithms return an array of collisions
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // If there are no collisions with the pointer, return rectangle intersections
  return rectIntersection(args);
}

/**
 * Formats a duration from nanoseconds into a human-readable string.
 * @param nanoseconds The duration in nanoseconds.
 * @returns A string in the format "X m XX s".
 */
export function formatDuration(nanoseconds: number): string {
  if (!nanoseconds) return "0 m 0 s";

  const totalSeconds = nanoseconds / 1_000_000_000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes} m ${Math.round(seconds)} s`;
}
