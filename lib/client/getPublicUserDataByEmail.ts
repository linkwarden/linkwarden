import { toast } from "react-hot-toast";

export default async function getPublicUserDataByEmail(email: string) {
  const response = await fetch(`/api/routes/users?email=${email}`);

  const data = await response.json();

  if (!response.ok) toast.error(data.response);

  return data.response;
}
