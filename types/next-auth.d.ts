import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      isSubscriber: boolean;
    };
  }

  interface User {
    id: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    id: number;
    isSubscriber: boolean;
    iat: number;
    exp: number;
    jti: string;
  }
}
