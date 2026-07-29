export type LatestAnnouncement = {
  id: string;
  message?: string;
};

export default async function getLatestAnnouncement(): Promise<LatestAnnouncement | null> {
  try {
    const response = await fetch(
      `https://linkwarden.app/blog/latest-announcement.json`
    );

    if (!response.ok) return null;

    const data = (await response.json()) as LatestAnnouncement;

    if (!data?.id) return null;

    return data;
  } catch (err) {
    return null;
  }
}
