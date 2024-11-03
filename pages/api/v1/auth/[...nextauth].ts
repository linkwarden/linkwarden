import { prisma } from "@/lib/api/db";
import sendInvitationRequest from "@/lib/api/sendInvitationRequest";
import sendVerificationRequest from "@/lib/api/sendVerificationRequest";
import updateSeats from "@/lib/api/stripe/updateSeats";
import verifySubscription from "@/lib/api/stripe/verifySubscription";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import type { NextApiRequest, NextApiResponse } from "next";
import { Adapter } from "next-auth/adapters";
import NextAuth from "next-auth/next";
import { Provider } from "next-auth/providers";
import FortyTwoProvider from "next-auth/providers/42-school";
import AppleProvider from "next-auth/providers/apple";
import AtlassianProvider from "next-auth/providers/atlassian";
import Auth0Provider from "next-auth/providers/auth0";
import AuthentikProvider from "next-auth/providers/authentik";
import AzureAdProvider from "next-auth/providers/azure-ad";
import AzureAdB2CProvider from "next-auth/providers/azure-ad-b2c";
import BattleNetProvider, {
  BattleNetIssuer,
} from "next-auth/providers/battlenet";
import BoxProvider from "next-auth/providers/box";
import CognitoProvider from "next-auth/providers/cognito";
import CoinbaseProvider from "next-auth/providers/coinbase";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import DropboxProvider from "next-auth/providers/dropbox";
import DuendeIDS6Provider from "next-auth/providers/duende-identity-server6";
import EmailProvider from "next-auth/providers/email";
import EVEOnlineProvider from "next-auth/providers/eveonline";
import FacebookProvider from "next-auth/providers/facebook";
import FaceItProvider from "next-auth/providers/faceit";
import FourSquareProvider from "next-auth/providers/foursquare";
import FreshbooksProvider from "next-auth/providers/freshbooks";
import FusionAuthProvider from "next-auth/providers/fusionauth";
import GitHubProvider from "next-auth/providers/github";
import GitlabProvider from "next-auth/providers/gitlab";
import GoogleProvider from "next-auth/providers/google";
import HubspotProvider from "next-auth/providers/hubspot";
import IdentityServer4Provider from "next-auth/providers/identity-server4";
import KakaoProvider from "next-auth/providers/kakao";
import KeycloakProvider from "next-auth/providers/keycloak";
import LineProvider from "next-auth/providers/line";
import LinkedInProvider from "next-auth/providers/linkedin";
import MailchimpProvider from "next-auth/providers/mailchimp";
import MailRuProvider from "next-auth/providers/mailru";
import NaverProvider from "next-auth/providers/naver";
import NetlifyProvider from "next-auth/providers/netlify";
import OktaProvider from "next-auth/providers/okta";
import OneLoginProvider from "next-auth/providers/onelogin";
import OssoProvider from "next-auth/providers/osso";
import OsuProvider from "next-auth/providers/osu";
import PatreonProvider from "next-auth/providers/patreon";
import PinterestProvider from "next-auth/providers/pinterest";
import PipedriveProvider from "next-auth/providers/pipedrive";
import RedditProvider from "next-auth/providers/reddit";
import SalesforceProvider from "next-auth/providers/salesforce";
import SlackProvider from "next-auth/providers/slack";
import SpotifyProvider from "next-auth/providers/spotify";
import StravaProvider from "next-auth/providers/strava";
import TodoistProvider from "next-auth/providers/todoist";
import TwitchProvider from "next-auth/providers/twitch";
import UnitedEffectsProvider from "next-auth/providers/united-effects";
import VkProvider from "next-auth/providers/vk";
import WikimediaProvider from "next-auth/providers/wikimedia";
import WordpressProvider from "next-auth/providers/wordpress";
import YandexProvider from "next-auth/providers/yandex";
import ZitadelProvider from "next-auth/providers/zitadel";
import ZohoProvider from "next-auth/providers/zoho";
import ZoomProvider from "next-auth/providers/zoom";
import * as process from "process";

const emailEnabled =
  process.env.EMAIL_FROM && process.env.EMAIL_SERVER ? true : false;

const newSsoUsersDisabled = process.env.DISABLE_NEW_SSO_USERS === "true";
const adapter = PrismaAdapter(prisma);

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const providers: Provider[] = [];

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
      async sendVerificationRequest({ identifier, url, provider, token }) {
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
    }),
    EmailProvider({
      id: "invite",
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 1200,
      async sendVerificationRequest({ identifier, url, provider, token }) {
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
    })
  );
}

// 42 School
if (process.env.NEXT_PUBLIC_FORTYTWO_ENABLED === "true") {
  providers.push(
    FortyTwoProvider({
      id: "42-school",
      name: "42 School",
      clientId: process.env.FORTY_TWO_CLIENT_ID!,
      clientSecret: process.env.FORTY_TWO_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.usual_full_name,
          email: profile.email,
          image: profile.image_url,
          username: profile.id.toString(),
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

// Apple
if (process.env.NEXT_PUBLIC_APPLE_ENABLED === "true") {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
          username: profile.sub,
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

// Atlassian
if (process.env.NEXT_PUBLIC_ATLASSIAN_ENABLED === "true") {
  providers.push(
    AtlassianProvider({
      clientId: process.env.ATLASSIAN_CLIENT_ID!,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "write:jira-work read:jira-work read:jira-user offline_access read:me",
        },
      },
      profile(profile) {
        return {
          id: profile.account_id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.account_id,
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

// Auth0
if (process.env.NEXT_PUBLIC_AUTH0_ENABLED === "true") {
  providers.push(
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      issuer: process.env.AUTH0_ISSUER,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Authelia
if (process.env.NEXT_PUBLIC_AUTHELIA_ENABLED === "true") {
  providers.push({
    id: "authelia",
    name: "Authelia",
    type: "oauth",
    clientId: process.env.AUTHELIA_CLIENT_ID!,
    clientSecret: process.env.AUTHELIA_CLIENT_SECRET!,
    wellKnown: process.env.AUTHELIA_WELLKNOWN_URL!,
    authorization: { params: { scope: "openid email profile" } },
    idToken: true,
    checks: ["pkce", "state"],
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        username: profile.preferred_username,
      };
    },
  });

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Authentik
if (process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === "true") {
  providers.push(
    AuthentikProvider({
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
      issuer: process.env.AUTHENTIK_ISSUER,
      profile: (profile) => {
        return {
          id: profile.sub,
          username: profile.preferred_username,
          name: profile.name || "",
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

// Azure AD B2C
if (process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === "true") {
  providers.push(
    AzureAdB2CProvider({
      tenantId: process.env.AZURE_AD_B2C_TENANT_NAME,
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
      primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW,
      authorization: { params: { scope: "offline_access openid" } },
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const {
      "not-before-policy": _,
      refresh_expires_in,
      refresh_token_expires_in,
      not_before,
      id_token_expires_in,
      profile_info,
      ...data
    } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Azure AD
if (process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === "true") {
  providers.push(
    AzureAdProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const {
      "not-before-policy": _,
      refresh_expires_in,
      token_type,
      expires_in,
      ext_expires_in,
      access_token,
      ...data
    } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Battle.net
if (process.env.NEXT_PUBLIC_BATTLENET_ENABLED === "true") {
  providers.push(
    BattleNetProvider({
      clientId: process.env.BATTLENET_CLIENT_ID!,
      clientSecret: process.env.BATTLENET_CLIENT_SECRET!,
      issuer: process.env.BATTLENET_ISSUER as BattleNetIssuer,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Box
if (process.env.NEXT_PUBLIC_BOX_ENABLED === "true") {
  providers.push(
    BoxProvider({
      clientId: process.env.BOX_CLIENT_ID,
      clientSecret: process.env.BOX_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Cognito
if (process.env.NEXT_PUBLIC_COGNITO_ENABLED === "true") {
  providers.push(
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Coinbase
if (process.env.NEXT_PUBLIC_COINBASE_ENABLED === "true") {
  providers.push(
    CoinbaseProvider({
      clientId: process.env.COINBASE_CLIENT_ID,
      clientSecret: process.env.COINBASE_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Discord
if (process.env.NEXT_PUBLIC_DISCORD_ENABLED === "true") {
  providers.push(
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Dropbox
if (process.env.NEXT_PUBLIC_DROPBOX_ENABLED === "true") {
  providers.push(
    DropboxProvider({
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Duende IdentityServer6
if (process.env.NEXT_PUBLIC_DUENDE_IDS6_ENABLED === "true") {
  providers.push(
    DuendeIDS6Provider({
      clientId: process.env.DUENDE_IDS6_ID!,
      clientSecret: process.env.DUENDE_IDS6_SECRET!,
      issuer: process.env.DUENDE_IDS6_ISSUER,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// EVE Online
if (process.env.NEXT_PUBLIC_EVEONLINE_ENABLED === "true") {
  providers.push(
    EVEOnlineProvider({
      clientId: process.env.EVE_CLIENT_ID!,
      clientSecret: process.env.EVE_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Facebook
if (process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === "true") {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// FACEIT
if (process.env.NEXT_PUBLIC_FACEIT_ENABLED === "true") {
  providers.push(
    FaceItProvider({
      clientId: process.env.FACEIT_CLIENT_ID,
      clientSecret: process.env.FACEIT_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Foursquare
if (process.env.NEXT_PUBLIC_FOURSQUARE_ENABLED === "true") {
  providers.push(
    FourSquareProvider({
      clientId: process.env.FOURSQUARE_CLIENT_ID,
      clientSecret: process.env.FOURSQUARE_CLIENT_SECRET,
      apiVersion: process.env.FOURSQUARE_APIVERSION,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Freshbooks
if (process.env.NEXT_PUBLIC_FRESHBOOKS_ENABLED === "true") {
  providers.push(
    FreshbooksProvider({
      clientId: process.env.FRESHBOOKS_CLIENT_ID,
      clientSecret: process.env.FRESHBOOKS_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// FusionAuth
if (process.env.NEXT_PUBLIC_FUSIONAUTH_ENABLED === "true") {
  providers.push(
    FusionAuthProvider({
      id: "fusionauth",
      name: "FusionAuth",
      issuer: process.env.FUSIONAUTH_ISSUER,
      clientId: process.env.FUSIONAUTH_CLIENT_ID!,
      clientSecret: process.env.FUSIONAUTH_SECRET!,
      tenantId: process.env.FUSIONAUTH_TENANT_ID,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// GitHub
if (process.env.NEXT_PUBLIC_GITHUB_ENABLED === "true") {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// GitLab
if (process.env.NEXT_PUBLIC_GITLAB_ENABLED === "true") {
  providers.push(
    GitlabProvider({
      clientId: process.env.GITLAB_CLIENT_ID!,
      clientSecret: process.env.GITLAB_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Google
if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true") {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      httpOptions: {
        timeout: 10000,
      },
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// HubSpot
if (process.env.NEXT_PUBLIC_HUBSPOT_ENABLED === "true") {
  providers.push(
    HubspotProvider({
      clientId: process.env.HUBSPOT_CLIENT_ID!,
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// IdentityServer4
if (process.env.NEXT_PUBLIC_IDS4_ENABLED === "true") {
  providers.push(
    IdentityServer4Provider({
      id: "identity-server4",
      name: "IdentityServer4",
      issuer: process.env.IdentityServer4_Issuer,
      clientId: process.env.IdentityServer4_CLIENT_ID,
      clientSecret: process.env.IdentityServer4_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Kakao
if (process.env.NEXT_PUBLIC_KAKAO_ENABLED === "true") {
  providers.push(
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Keycloak
if (process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === "true") {
  providers.push(
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER,
      profile: (profile) => {
        return {
          id: profile.sub,
          username: profile.preferred_username,
          name: profile.name || "",
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

// LINE
if (process.env.NEXT_PUBLIC_LINE_ENABLED === "true") {
  providers.push(
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// LinkedIn
if (process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === "true") {
  providers.push(
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Mailchimp
if (process.env.NEXT_PUBLIC_MAILCHIMP_ENABLED === "true") {
  providers.push(
    MailchimpProvider({
      clientId: process.env.MAILCHIMP_CLIENT_ID,
      clientSecret: process.env.MAILCHIMP_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Mail.ru
if (process.env.NEXT_PUBLIC_MAILRU_ENABLED === "true") {
  providers.push(
    MailRuProvider({
      clientId: process.env.MAILRU_CLIENT_ID,
      clientSecret: process.env.MAILRU_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Naver
if (process.env.NEXT_PUBLIC_NAVER_ENABLED === "true") {
  providers.push(
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Netlify
if (process.env.NEXT_PUBLIC_NETLIFY_ENABLED === "true") {
  providers.push(
    NetlifyProvider({
      clientId: process.env.NETLIFY_CLIENT_ID,
      clientSecret: process.env.NETLIFY_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Okta
if (process.env.NEXT_PUBLIC_OKTA_ENABLED === "true") {
  providers.push(
    OktaProvider({
      clientId: process.env.OKTA_CLIENT_ID!,
      clientSecret: process.env.OKTA_CLIENT_SECRET!,
      issuer: process.env.OKTA_ISSUER,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// OneLogin
if (process.env.NEXT_PUBLIC_ONELOGIN_ENABLED === "true") {
  providers.push(
    OneLoginProvider({
      clientId: process.env.ONELOGIN_CLIENT_ID,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET,
      issuer: process.env.ONELOGIN_ISSUER,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Osso
if (process.env.NEXT_PUBLIC_OSSO_ENABLED === "true") {
  providers.push(
    OssoProvider({
      clientId: process.env.OSSO_CLIENT_ID,
      clientSecret: process.env.OSSO_CLIENT_SECRET,
      issuer: process.env.OSSO_ISSUER,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// osu!
if (process.env.NEXT_PUBLIC_OSU_ENABLED === "true") {
  providers.push(
    OsuProvider({
      clientId: process.env.OSU_CLIENT_ID!,
      clientSecret: process.env.OSU_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Patreon
if (process.env.NEXT_PUBLIC_PATREON_ENABLED === "true") {
  providers.push(
    PatreonProvider({
      clientId: process.env.PATREON_ID!,
      clientSecret: process.env.PATREON_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Pinterest
if (process.env.NEXT_PUBLIC_PINTEREST_ENABLED === "true") {
  providers.push(
    PinterestProvider({
      clientId: process.env.PINTEREST_ID!,
      clientSecret: process.env.PINTEREST_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Pipedrive
if (process.env.NEXT_PUBLIC_PIPEDRIVE_ENABLED === "true") {
  providers.push(
    PipedriveProvider({
      clientId: process.env.PIPEDRIVE_CLIENT_ID!,
      clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Reddit
if (process.env.NEXT_PUBLIC_REDDIT_ENABLED === "true") {
  providers.push(
    RedditProvider({
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Salesforce
if (process.env.NEXT_PUBLIC_SALESFORCE_ENABLED === "true") {
  providers.push(
    SalesforceProvider({
      clientId: process.env.SALESFORCE_CLIENT_ID!,
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Slack
if (process.env.NEXT_PUBLIC_SLACK_ENABLED === "true") {
  providers.push(
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Spotify
if (process.env.NEXT_PUBLIC_SPOTIFY_ENABLED === "true") {
  providers.push(
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Strava
if (process.env.NEXT_PUBLIC_STRAVA_ENABLED === "true") {
  providers.push(
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID!,
      clientSecret: process.env.STRAVA_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Todoist
if (process.env.NEXT_PUBLIC_TODOIST_ENABLED === "true") {
  providers.push(
    TodoistProvider({
      clientId: process.env.TODOIST_ID!,
      clientSecret: process.env.TODOIST_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Twitch
if (process.env.NEXT_PUBLIC_TWITCH_ENABLED === "true") {
  providers.push(
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID!,
      clientSecret: process.env.TWITCH_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// United Effects
if (process.env.NEXT_PUBLIC_UNITED_EFFECTS_ENABLED === "true") {
  providers.push(
    UnitedEffectsProvider({
      clientId: process.env.UNITED_EFFECTS_CLIENT_ID!,
      clientSecret: process.env.UNITED_EFFECTS_CLIENT_SECRET!,
      issuer: process.env.UNITED_EFFECTS_ISSUER!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// VK
if (process.env.NEXT_PUBLIC_VK_ENABLED === "true") {
  providers.push(
    VkProvider({
      clientId: process.env.VK_CLIENT_ID!,
      clientSecret: process.env.VK_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Wikimedia
if (process.env.NEXT_PUBLIC_WIKIMEDIA_ENABLED === "true") {
  providers.push(
    WikimediaProvider({
      clientId: process.env.WIKIMEDIA_CLIENT_ID!,
      clientSecret: process.env.WIKIMEDIA_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Wordpress.com
if (process.env.NEXT_PUBLIC_WORDPRESS_ENABLED === "true") {
  providers.push(
    WordpressProvider({
      clientId: process.env.WORDPRESS_CLIENT_ID,
      clientSecret: process.env.WORDPRESS_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Yandex
if (process.env.NEXT_PUBLIC_YANDEX_ENABLED === "true") {
  providers.push(
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Zitadel
if (process.env.NEXT_PUBLIC_ZITADEL_ENABLED === "true") {
  providers.push(
    ZitadelProvider({
      issuer: process.env.ZITADEL_ISSUER,
      clientId: process.env.ZITADEL_CLIENT_ID!,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Zoho
if (process.env.NEXT_PUBLIC_ZOHO_ENABLED === "true") {
  providers.push(
    ZohoProvider({
      clientId: process.env.ZOHO_CLIENT_ID,
      clientSecret: process.env.ZOHO_CLIENT_SECRET,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
}

// Zoom
if (process.env.NEXT_PUBLIC_ZOOM_ENABLED_ENABLED === "true") {
  providers.push(
    ZoomProvider({
      clientId: process.env.ZOOM_CLIENT_ID!,
      clientSecret: process.env.ZOOM_CLIENT_SECRET!,
    })
  );

  const _linkAccount = adapter.linkAccount;
  adapter.linkAccount = (account) => {
    const { "not-before-policy": _, refresh_expires_in, ...data } = account;
    return _linkAccount ? _linkAccount(data) : undefined;
  };
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
    callbacks: {
      async signIn({ user, account, profile, email, credentials }) {
        if (
          !(user as User).emailVerified &&
          !email?.verificationRequest
          // && (account?.provider === "email" || account?.provider === "google")
        ) {
          // Email is being verified for the first time...
          console.log("Email is being verified for the first time...");

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
                parentSubscriptionId: parentSubscriptionId,
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
