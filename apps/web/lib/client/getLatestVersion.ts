export default async function getLatestVersion(setShowAnnouncement: Function) {
  const announcementId = localStorage.getItem("announcementId");
  const announcementMessage = localStorage.getItem("announcementMessage");

  const response = await fetch(
    `https://linkwarden.app/blog/latest-announcement.json`
  );

  const data = await response.json();

  const latestAnnouncement = data.id;
  const latestMessage = data.message;

  if (
    announcementId != latestAnnouncement ||
    announcementMessage != latestMessage
  ) {
    setShowAnnouncement(true);
    if (latestAnnouncement)
      localStorage.setItem("announcementId", latestAnnouncement);
    if (latestMessage)
      localStorage.setItem("announcementMessage", latestMessage);
  }
}
