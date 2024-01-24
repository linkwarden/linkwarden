import { AccessToken } from "@prisma/client";
import { create } from "zustand";

// Token store

type ResponseObject = {
  ok: boolean;
  data: object | string;
};

type TokenStore = {
  tokens: Partial<AccessToken>[];
  setTokens: (data: Partial<AccessToken>[]) => void;
  addToken: (body: Partial<AccessToken>[]) => Promise<ResponseObject>;
  revokeToken: (tokenId: number) => Promise<ResponseObject>;
};

const useTokenStore = create<TokenStore>((set) => ({
  tokens: [],
  setTokens: async (data) => {
    set(() => ({
      tokens: data,
    }));
  },
  addToken: async (body) => {
    const response = await fetch("/api/v1/tokens", {
      body: JSON.stringify(body),
      method: "POST",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        tokens: [...state.tokens, data.response.token],
      }));

    return { ok: response.ok, data: data.response };
  },
  revokeToken: async (tokenId) => {
    const response = await fetch(`/api/v1/tokens/${tokenId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok)
      set((state) => ({
        tokens: state.tokens.filter((token) => token.id !== tokenId),
      }));

    return { ok: response.ok, data: data.response };
  },
}));

export default useTokenStore;
