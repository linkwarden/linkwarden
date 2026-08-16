import { prisma } from "@linkwarden/prisma";
import sendInvitationRequest from "@/lib/api/sendInvitationRequest";
import sendVerificationRequest from "@/lib/api/sendVerificationRequest";
import updateSeats from "@/lib/api/billing/updateSeats";
import verifySubscription from "@/lib/api/billing/verifySubscription";
import { authProviders, isAuthProviderEnabled } from "@/lib/api/authProviders";
import { ssoEmailVerified } from "@/lib/api/ssoEmailVerified";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { User } from "@linkwarden/prisma/client";
import bcrypt from "bcrypt";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Adapter } from "next-auth/adapters";
import NextAuth from "next-auth/next";
import { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import * as process from "process";

type LinkAccountInput = Parameters<
  NonNullable<ReturnType<typeof PrismaAdapter>["linkAccount"]>
>[0];

function sanitizeAccount(account: LinkAccountInput): LinkAccountInput {
  return {
    userId: account.userId,
    type: account.type,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token,
    access_token: account.access_token,
    expires_at: account.expires_at,
    token_type: account.token_type,
    scope: account.scope,
    id_token: account.id_token,
    session_state: account.session_state,
  };
}

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

const newSsoUsersDisabled = process.env.DISABLE_NEW_SSO_USERS === "true";
const adapter = PrismaAdapter(prisma);
const linkAccount = adapter.linkAccount;

adapter.linkAccount = (account) => linkAccount?.(sanitizeAccount(account));

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const providers: Provider[] = [];
const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://");
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

if (process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED !== "false") {
  // undefined is for backwards compatibility
  providers.push(
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
              }
            : {
                username: username.toLowerCase(),
              },
        });

        if (!user) throw Error("Invalid credentials.");
        else if (!user?.emailVerified && emailEnabled) {
          throw Error("Email not verified.");
        }

        let passwordMatches: boolean = false;

        if (user?.password) {
          passwordMatches = bcrypt.compareSync(password, user.password);
        }

        if (passwordMatches && user?.password) {
          return { id: user?.id };
        } else throw Error("Invalid credentials.");
      },
    })
  );
}

if (emailEnabled) {
  providers.push(
    EmailProvider({
      id: "email",
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 1200,
      async sendVerificationRequest({ identifier, url, provider, token }: any) {
        const recentVerificationRequestsCount =
          await prisma.verificationToken.count({
            where: {
              identifier,
              createdAt: {
                gt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes
              },
            },
          });

        if (recentVerificationRequestsCount >= 4)
          throw Error("Too many requests. Please try again later.");

        sendVerificationRequest({
          identifier,
          url,
          from: provider.from as string,
          token,
        });
      },
    } as any),
    EmailProvider({
      id: "invite",
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 1200,
      async sendVerificationRequest({ identifier, url, provider, token }: any) {
        const parentSubscriptionEmail = (
          await prisma.user.findFirst({
            where: {
              email: identifier,
              emailVerified: null,
            },
            include: {
              parentSubscription: {
                include: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          })
        )?.parentSubscription?.user.email;

        if (!parentSubscriptionEmail) throw Error("Invalid email.");

        const recentVerificationRequestsCount =
          await prisma.verificationToken.count({
            where: {
              identifier,
              createdAt: {
                gt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes
              },
            },
          });

        if (recentVerificationRequestsCount >= 4)
          throw Error("Too many requests. Please try again later.");

        sendInvitationRequest({
          parentSubscriptionEmail,
          identifier,
          url,
          from: provider.from as string,
          token,
        });
      },
    } as any)
  );
}

for (const entry of authProviders) {
  if (isAuthProviderEnabled(entry)) {
    providers.push(entry.build());
  }
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, {
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
    cookies: {
      pkceCodeVerifier: {
        name: `${cookiePrefix}next-auth.pkce.code_verifier`,
        options: {
          httpOnly: true,
          sameSite: useSecureCookies ? "none" : "lax",
          path: "/",
          secure: useSecureCookies,
          maxAge: 60 * 15,
        },
      },
    },
    callbacks: {
      async signIn({ user, account, email, profile }) {
        if (!(user as User).emailVerified && !email?.verificationRequest) {
          const parentSubscriptionId = (user as User).parentSubscriptionId;

          if (parentSubscriptionId) {
            // Add seat request to Stripe
            const parentSubscription = await prisma.subscription.findFirst({
              where: {
                id: parentSubscriptionId,
              },
            });

            // Count child users with verified email under a specific subscription, excluding the current user
            const verifiedChildUsersCount = await prisma.user.count({
              where: {
                parentSubscriptionId,
                id: {
                  not: user.id as number,
                },
                emailVerified: {
                  not: null,
                },
              },
            });

            if (
              STRIPE_SECRET_KEY &&
              parentSubscription?.quantity &&
              parentSubscription.provider === "STRIPE" &&
              parentSubscription.stripeSubscriptionId &&
              verifiedChildUsersCount + 2 > // add current user and the admin
                parentSubscription.quantity
            ) {
              // Add seat if the user count exceeds the subscription limit
              await updateSeats(
                parentSubscription.stripeSubscriptionId,
                verifiedChildUsersCount + 2
              );
            }
          }
        }

        if (account?.provider !== "credentials") {
          // registration via SSO can be separately disabled
          const existingUser = await prisma.account.findFirst({
            where: {
              providerAccountId: account?.providerAccountId,
            },
          });

          if (!existingUser && newSsoUsersDisabled) {
            return false;
          }

          // If user is already registered, link the provider
          if (user.email && account) {
            const findUser = await prisma.user.findFirst({
              where: {
                email: user.email,
              },
              include: {
                accounts: true,
              },
            });

            if (findUser && findUser.accounts.length === 0) {
              if (account.type !== "email" && !ssoEmailVerified(profile)) {
                return false;
              }

              await prisma.account.create({
                data: {
                  userId: findUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  id_token: account.id_token,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  session_state: account.session_state,
                },
              });
            }
          }
        }

        return true;
      },
      async jwt({ token, trigger, user }) {
        token.sub = token.sub ? Number(token.sub) : undefined;
        if (trigger === "signIn" || trigger === "signUp")
          token.id = user?.id as number;

        if (trigger === "signUp") {
          const userExists = await prisma.user.findUnique({
            where: {
              id: token.id,
            },
            include: {
              accounts: true,
            },
          });

          // Verify SSO user email
          if (userExists && userExists.accounts.length > 0) {
            await prisma.user.update({
              where: {
                id: userExists.id,
              },
              data: {
                emailVerified: new Date(),
                dashboardSections: {
                  createMany: {
                    data: [
                      {
                        order: 0,
                        type: "STATS",
                      },
                      {
                        order: 1,
                        type: "RECENT_LINKS",
                      },
                      {
                        order: 2,
                        type: "PINNED_LINKS",
                      },
                    ],
                  },
                },
              },
            });
          }

          if (userExists && !userExists.username) {
            const autoGeneratedUsername =
              "user" + Math.round(Math.random() * 1000000000);

            await prisma.user.update({
              where: {
                id: token.id,
              },
              data: {
                username: autoGeneratedUsername,
              },
            });
          }
        } else if (trigger === "signIn") {
          const user = await prisma.user.findUnique({
            where: {
              id: token.id,
            },
          });

          if (user && !user.username) {
            const autoGeneratedUsername =
              "user" + Math.round(Math.random() * 1000000000);

            await prisma.user.update({
              where: { id: user.id },
              data: { username: autoGeneratedUsername },
            });
          }
        }

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
              parentSubscription: true,
            },
          });

          if (user) {
            //
            const subscribedUser = await verifySubscription(user);
          }
        }

        return session;
      },
    },
  });
}
