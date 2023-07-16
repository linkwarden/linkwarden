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
import checkSubscription from "@/lib/api/checkSubscription";

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

const providers: Provider[] = [
  CredentialsProvider({
    type: "credentials",
    credentials: {},
    async authorize(credentials, req) {
      if (!credentials) return null;

      const { username, password } = credentials as {
        username: string;
        password: string;
      };

      const findUser = await prisma.user.findFirst({
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

      if (findUser?.password) {
        passwordMatches = bcrypt.compareSync(password, findUser.password);
      }

      if (passwordMatches) {
        return findUser;
      } else return null as any;
    },
  }),
];

if (emailEnabled)
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

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
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
    session: async ({ session, token }: { session: Session; token: JWT }) => {
      session.user.id = parseInt(token.id as string);
      session.user.username = token.username as string;
      session.user.isSubscriber = token.isSubscriber as boolean;

      return session;
    },
    // Using the `...rest` parameter to be able to narrow down the type based on `trigger`
    async jwt({ token, trigger, session, user }) {
      const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
      const PRICE_ID = process.env.PRICE_ID;

      console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAaa", token);

      const secondsInTwoWeeks = 1209600;
      const subscriptionIsTimesUp =
        token.subscriptionCanceledAt &&
        new Date() >
          new Date(
            ((token.subscriptionCanceledAt as number) + secondsInTwoWeeks) *
              1000
          );

      if (STRIPE_SECRET_KEY && PRICE_ID && (trigger || subscriptionIsTimesUp)) {
        console.log("EXECUTED!!!");
        const subscription = await checkSubscription(
          STRIPE_SECRET_KEY,
          token.email as string,
          PRICE_ID
        );

        subscription.isSubscriber;

        if (subscription.subscriptionCanceledAt) {
          token.subscriptionCanceledAt = subscription.subscriptionCanceledAt;
        } else token.subscriptionCanceledAt = undefined;

        token.isSubscriber = subscription.isSubscriber;
      }

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
