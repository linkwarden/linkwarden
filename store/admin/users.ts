import { User as U } from "@prisma/client";
import { create } from "zustand";

interface User extends U {
  subscriptions: {
    active: boolean;
  };
}

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type UserStore = {
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: () => Promise<ResponseObject>;
  removeUser: (userId: number) => Promise<ResponseObject>;
};

const useUserStore = create<UserStore>((set) => ({
  users: [],
  setUsers: async () => {
    const response = await fetch("/api/v1/users");

    const data = await response.json();

    if (response.ok) set({ users: data.response });
  },
  addUser: async () => {
    const response = await fetch("/api/v1/users", {
      method: "POST",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        users: [...state.users, data.response],
      }));

    return { ok: response.ok, data: data.response };
  },
  removeUser: async (userId) => {
    const response = await fetch(`/api/v1/users/${userId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        users: state.users.filter((user) => user.id !== userId),
      }));

    return { ok: response.ok, data: data.response };
  },
}));

export default useUserStore;
