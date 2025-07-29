import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function titleCase(str: string) {
  var splitStr = str.toLowerCase().split(" ");
  for (var i = 0; i < splitStr.length; i++) {
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  return splitStr.join(" ");
}

export function delay(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
