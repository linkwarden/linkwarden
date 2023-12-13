import { Link } from "@prisma/client";

export function screenshotAvailable(link: any) {
  return (
    link &&
    link.screenshotPath &&
    link.screenshotPath !== "pending" &&
    link.screenshotPath !== "failed"
  );
}

export function pdfAvailable(link: any) {
  return (
    link &&
    link.pdfPath &&
    link.pdfPath !== "pending" &&
    link.pdfPath !== "failed"
  );
}

export function readabilityAvailable(link: any) {
  return (
    link &&
    link.readabilityPath &&
    link.readabilityPath !== "pending" &&
    link.readabilityPath !== "failed"
  );
}
