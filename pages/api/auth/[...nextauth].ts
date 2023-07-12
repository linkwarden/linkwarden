import { prisma } from "@/lib/api/db";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions, Session } from "next-auth";
import bcrypt from "bcrypt";
import EmailProvider from "next-auth/providers/email";
import { JWT } from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import sendVerificationRequest from "@/lib/api/sendVerificationRequest";
import { Provider } from "next-auth/providers";

const providers: Provider[] = [
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
          OR: [
            {
              username: credentials.username.toLowerCase(),
            },
            {
              email: credentials.username.toLowerCase(),
            },
          ],
          emailVerified: { not: null },
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
];

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM)
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 600,
      sendVerificationRequest(params) {
        sendVerificationRequest(params);
      },
    })
  );

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  providers,
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
