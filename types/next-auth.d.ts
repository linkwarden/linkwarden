import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
    };
  }

  interface User {
    id: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: number;
    id: number;
    iat: number;
    exp: number;
    jti: string;
  }
}
