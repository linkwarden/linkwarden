import { toast } from "react-hot-toast";

export default async function getPublicUserData({
  username,
  id,
}: {
  username?: string;
  id?: number;
}) {
  const response = await fetch(
    `/api/users?id=${id}&${
      username ? `username=${username?.toLowerCase()}` : undefined
    }`
  );

  const data = await response.json();

  if (!response.ok) toast.error(data.response);

  return data.response;
}
