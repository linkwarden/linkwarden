export function screenshotAvailable(link: any) {
  return (
    link &&
    link.screenshotPath &&
    link.screenshotPath !== "pending" &&
    link.screenshotPath !== "unavailable"
  );
}

export function pdfAvailable(link: any) {
  return (
    link &&
    link.pdfPath &&
    link.pdfPath !== "pending" &&
    link.pdfPath !== "unavailable"
  );
}

export function readabilityAvailable(link: any) {
  return (
    link &&
    link.readabilityPath &&
    link.readabilityPath !== "pending" &&
    link.readabilityPath !== "unavailable"
  );
}
