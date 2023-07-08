import { toast } from "react-hot-toast";

export default async function getPublicUserDataByEmail(username: string) {
  const response = await fetch(
    `/api/routes/users?username=${username.toLowerCase()}`
  );

  const data = await response.json();

  if (!response.ok) toast.error(data.response);

  return data.response;
}
