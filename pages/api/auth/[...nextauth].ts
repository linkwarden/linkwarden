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

        const findUser = await prisma.user.findFirst({
          where: {
            email: email.toLowerCase(),
          },
        });

        let passwordMatches: boolean = false;

        if (findUser?.password) {
          passwordMatches = bcrypt.compareSync(password, findUser.password);
        }

        if (passwordMatches) {
          return {
            id: findUser?.id,
            name: findUser?.name,
            email: findUser?.email.toLowerCase(),
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
    // Using the `...rest` parameter to be able to narrow down the type based on `trigger`
    jwt({ token, trigger, session }) {
      if (trigger === "update" && session?.name && session?.email) {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        token.name = session.name;
        token.email = session.email.toLowerCase();
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
