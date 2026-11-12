// Whether the root layout should send the app to /incoming to save a shared
// link. `sharedUrl` is the link waiting to be saved, `incomingShownFor` the
// link /incoming last opened with, and `redirectedFrom` the screen the last
// redirect to /incoming was sent from.
//
// On a cold start the index screen's redirect to the dashboard can land after
// ours, so a link that never reached /incoming is sent again, once per screen.
// A link /incoming already opened with isn't, so a signed-out user it sends
// back to the login screen stays there.
export const shouldOpenIncoming = ({
  pathname,
  hasShareIntent,
  sharedUrl,
  incomingShownFor,
  redirectedFrom,
}: {
  pathname: string;
  hasShareIntent: boolean;
  sharedUrl: string;
  incomingShownFor: string | null;
  redirectedFrom: string | null;
}) => {
  if (pathname === "/incoming" || pathname === redirectedFrom) return false;

  return (
    pathname.startsWith("/dataUrl=") ||
    hasShareIntent ||
    (!!sharedUrl && incomingShownFor !== sharedUrl)
  );
};
