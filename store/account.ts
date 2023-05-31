import { create } from "zustand";
import { AccountSettings } from "@/types/global";
import avatarExists from "@/lib/client/avatarExists";

type AccountStore = {
  account: AccountSettings;
  setAccount: (email: string) => void;
  updateAccount: (user: AccountSettings) => Promise<boolean>;
};

const determineProfilePicSource = async (data: any) => {
  const path = `/api/avatar/${data.response.id}`;
  const imageExists = await avatarExists(path);
  if (imageExists) return path + "?" + Date.now();
  else return null;
};

const useAccountStore = create<AccountStore>()((set) => ({
  account: {} as AccountSettings,
  setAccount: async (email) => {
    const response = await fetch(`/api/routes/users?email=${email}`);

    const data = await response.json();

    const profilePic = await determineProfilePicSource(data);

    if (response.ok) set({ account: { ...data.response, profilePic } });
  },
  updateAccount: async (user) => {
    const response = await fetch("/api/routes/users", {
      method: "PUT",
      body: JSON.stringify(user),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    console.log(data);

    const profilePic = await determineProfilePicSource(data);

    if (response.ok) set({ account: { ...data.response, profilePic } });

    return response.ok;
  },
}));

export default useAccountStore;
