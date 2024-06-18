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
  setUsers: () => void;
  addUser: (body: Partial<U>) => Promise<ResponseObject>;
  removeUser: (userId: number) => Promise<ResponseObject>;
};

const useUserStore = create<UserStore>((set) => ({
  users: [],
  setUsers: async () => {
    const response = await fetch("/api/v1/users");

    const data = await response.json();

    if (response.ok) set({ users: data.response });
    else if (response.status === 401) window.location.href = "/dashboard";
  },
  addUser: async (body) => {
    const response = await fetch("/api/v1/users", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
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
