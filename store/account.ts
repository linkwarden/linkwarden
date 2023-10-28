import { create } from "zustand";
import { AccountSettings } from "@/types/global";

type ResponseObject = {
  ok: boolean;
  data: Omit<AccountSettings, "password"> | object | string;
};

type AccountStore = {
  account: AccountSettings;
  setAccount: (id: number) => void;
  updateAccount: (user: AccountSettings) => Promise<ResponseObject>;
};

const useAccountStore = create<AccountStore>()((set) => ({
  account: {} as AccountSettings,
  setAccount: async (id) => {
    const response = await fetch(`/api/v1/users/${id}`);

    const data = await response.json();

    if (response.ok) set({ account: { ...data.response } });
  },
  updateAccount: async (user) => {
    const response = await fetch(`/api/v1/users/${user.id}`, {
      method: "PUT",
      body: JSON.stringify(user),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) set({ account: { ...data.response } });

    return { ok: response.ok, data: data.response };
  },
}));

export default useAccountStore;
