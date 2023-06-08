import { create } from "zustand";
import { AccountSettings } from "@/types/global";

type AccountStore = {
  account: AccountSettings;
  setAccount: (email: string) => void;
  updateAccount: (user: AccountSettings) => Promise<boolean>;
};

const useAccountStore = create<AccountStore>()((set) => ({
  account: {} as AccountSettings,
  setAccount: async (email) => {
    const response = await fetch(`/api/routes/users?email=${email}`);

    const data = await response.json();

    const profilePic = `/api/avatar/${data.response.id}?${Date.now()}`;

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

    if (response.ok) set({ account: { ...data.response } });

    return response.ok;
  },
}));

export default useAccountStore;
