export default async function getLatestVersion(setShowAnnouncement: Function) {
  const announcementId = localStorage.getItem("announcementId");

  const response = await fetch(
    `https://blog.linkwarden.app/latest-announcement.json`
  );

  const data = await response.json();

  const latestAnnouncement = data.id;

  if (announcementId !== latestAnnouncement) {
    setShowAnnouncement(true);
    localStorage.setItem("announcementId", latestAnnouncement);
  }
}
