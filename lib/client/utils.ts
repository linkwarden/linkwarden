export function isPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes("android-app://")
  );
}

export function dropdownTriggerer(e: any) {
  let targetEl = e.currentTarget;
  if (targetEl && targetEl.matches(":focus")) {
    setTimeout(function () {
      targetEl.blur();
    }, 0);
  }
}
