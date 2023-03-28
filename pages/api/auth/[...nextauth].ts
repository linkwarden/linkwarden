import { prisma } from "@/lib/api/db";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      async authorize(credentials, req) {
        const { email, password } = credentials as {
          id: number;
          email: string;
          password: string;
        };

        console.log(email, password);

        const findUser = await prisma.user.findFirst({
          where: {
            email: email,
          },
        });

        console.log(findUser);

        let passwordMatches: boolean = false;

        if (findUser?.password) {
          passwordMatches = bcrypt.compareSync(password, findUser.password);
        }

        console.log(passwordMatches);

        if (passwordMatches) {
          return {
            id: findUser?.id,
            name: findUser?.name,
            email: findUser?.email,
          };
        } else return null as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, token }) => {
      session.user.id = parseInt(token?.sub as any);

      return session;
    },
  },
};

export default NextAuth(authOptions);
