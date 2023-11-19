import { prisma } from "@/lib/api/db";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthOptions } from "next-auth";
import bcrypt from "bcrypt";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";
import sendVerificationRequest from "@/lib/api/sendVerificationRequest";
import { Provider } from "next-auth/providers";
import verifySubscription from "@/lib/api/verifySubscription";
import KeycloakProvider from "next-auth/providers/keycloak";

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

const keycloakEnabled = process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === "true";

const adapter = PrismaAdapter(prisma);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const providers: Provider[] = [
  CredentialsProvider({
    type: "credentials",
    credentials: {},
    async authorize(credentials, req) {
      console.log("User log in attempt...");
      if (!credentials) return null;

      const { username, password } = credentials as {
        username: string;
        password: string;
      };

      const user = await prisma.user.findFirst({
        where: emailEnabled
          ? {
              OR: [
                {
                  username: username.toLowerCase(),
                },
                {
                  email: username?.toLowerCase(),
                },
              ],
              emailVerified: { not: null },
            }
          : {
              username: username.toLowerCase(),
            },
      });

      let passwordMatches: boolean = false;

      if (user?.password) {
        passwordMatches = bcrypt.compareSync(password, user.password);
      }

      if (passwordMatches) {
        return { id: user?.id };
      } else return null as any;
    },
  }),
];

if (emailEnabled) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 1200,
      sendVerificationRequest(params) {
        sendVerificationRequest(params);
      },
    })
  );
}

if (keycloakEnabled) {
  providers.push(
    KeycloakProvider({
      id: "keycloak",
      name: "Keycloak",
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      profile: (profile) => {
        return {
          id: profile.sub,
          username: profile.preferred_username,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
        };
      },
    })
  );
  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

export const authOptions: AuthOptions = {
  adapter: adapter as Adapter,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/confirmation",
  },
  callbacks: {
    async jwt({ token, trigger, user }) {
      token.sub = token.sub ? Number(token.sub) : undefined;
      if (trigger === "signIn" || trigger === "signUp")
        token.id = user?.id as number;

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;

      if (STRIPE_SECRET_KEY) {
        const user = await prisma.user.findUnique({
          where: {
            id: token.id,
          },
          include: {
            subscriptions: true,
          },
        });

        if (user) {
          const subscribedUser = await verifySubscription(user);
        }
      }

      return session;
    },
  },
};

export default NextAuth(authOptions);
