export const copyTextToClipboard = async (text: string) => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back for self-hosted HTTP deployments where Clipboard API calls can be blocked.
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const activeElement =
    typeof HTMLElement !== "undefined" &&
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const textArea = document.createElement("textarea");

  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-9999px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return document.execCommand?.("copy") ?? false;
  } finally {
    textArea.remove();
    activeElement?.focus();
  }
};
