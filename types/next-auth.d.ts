import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      username: string;
      email: string;
      isSubscriber: boolean;
    };
  }

  interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    emailVerified: Date;
    image: string;
    password: string;
    archiveAsScreenshot: boolean;
    archiveAsPDF: boolean;
    archiveAsWaybackMachine: boolean;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    name: string;
    email: string;
    picture: string;
    sub: string;
    isSubscriber: boolean;
    id: number;
    username: string;
    iat: number;
    exp: number;
    jti: string;
  }
}
