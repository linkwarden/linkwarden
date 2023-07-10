import { prisma } from "@/lib/api/db";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions, Session } from "next-auth";
import bcrypt from "bcrypt";
import EmailProvider from "next-auth/providers/email";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      type: "credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials, req) {
        if (!credentials) return null;

        const findUser = await prisma.user.findFirst({
          where: {
            username: credentials.username.toLowerCase(),
          },
        });

        let passwordMatches: boolean = false;

        if (findUser?.password) {
          passwordMatches = bcrypt.compareSync(
            credentials.password,
            findUser.password
          );
        }

        if (passwordMatches) {
          return findUser;
        } else return null as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      session.user.id = parseInt(token.id as string);
      session.user.username = token.username as string;

      return session;
    },
    // Using the `...rest` parameter to be able to narrow down the type based on `trigger`
    jwt({ token, trigger, session, user }) {
      if (trigger === "signIn") {
        token.id = user.id;
        token.username = (user as any).username;
      } else if (trigger === "update" && session?.name && session?.username) {
        // Note, that `session` can be any arbitrary object, remember to validate it!
        token.name = session.name;
        token.username = session.username.toLowerCase();
        token.email = session.email.toLowerCase();
      }
      return token;
    },
  },
};

export default NextAuth(authOptions);
