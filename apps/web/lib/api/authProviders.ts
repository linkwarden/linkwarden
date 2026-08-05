import { getAppleClientId, getAppleClientSecret } from "./apple";
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
import DiscordProvider from "next-auth/providers/discord";
import DropboxProvider from "next-auth/providers/dropbox";
import DuendeIDS6Provider from "next-auth/providers/duende-identity-server6";
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

export type AuthProviderEntry = {
  // next-auth provider id; stored in Account.provider and part of the OAuth
  // callback URL, so it must never change for an existing provider
  id: string;
  defaultName: string;
  // enabled when any of these env vars is "true"
  flagEnvs: string[];
  customNameEnv: string;
  build: () => Provider;
};

export function isAuthProviderEnabled(entry: AuthProviderEntry) {
  return entry.flagEnvs.some((flag) => process.env[flag] === "true");
}

export function getAuthProviderButtonName(entry: AuthProviderEntry) {
  return process.env[entry.customNameEnv] ?? entry.defaultName;
}

const TIMEOUT = { httpOptions: { timeout: 10000 } };

function oauth(
  factory: (options: any) => Provider,
  clientIdEnv: string,
  clientSecretEnv: string,
  extra?: Record<string, unknown>
): () => Provider {
  return () =>
    factory({
      clientId: process.env[clientIdEnv] as string,
      clientSecret: process.env[clientSecretEnv] as string,
      ...extra,
    });
}

const oidcUserProfile = (profile: any) => {
  return {
    id: profile.sub,
    username: profile.preferred_username,
    name: profile.name || "",
    email: profile.email,
    image: profile.picture,
  };
};

function genericOidc(opts: {
  id: string;
  name: string;
  envPrefix: string;
  scope?: string;
  timeout?: boolean;
}): Provider {
  return {
    id: opts.id,
    name: opts.name,
    type: "oauth",
    clientId: process.env[`${opts.envPrefix}_CLIENT_ID`] as string,
    clientSecret: process.env[`${opts.envPrefix}_CLIENT_SECRET`] as string,
    wellKnown: process.env[`${opts.envPrefix}_WELLKNOWN_URL`] as string,
    authorization: {
      params: { scope: opts.scope ?? "openid email profile" },
    },
    idToken: true,
    checks: ["pkce", "state"],
    ...(opts.timeout ? TIMEOUT : {}),
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        username: profile.preferred_username,
      };
    },
  };
}

export const authProviders: AuthProviderEntry[] = [
  {
    id: "42-school",
    defaultName: "42 School",
    flagEnvs: ["NEXT_PUBLIC_FORTYTWO_ENABLED"],
    customNameEnv: "FORTYTWO_CUSTOM_NAME",
    build: () =>
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
      }),
  },
  {
    id: "apple",
    defaultName: "Apple",
    flagEnvs: ["NEXT_PUBLIC_APPLE_ENABLED"],
    customNameEnv: "APPLE_CUSTOM_NAME",
    build: () =>
      AppleProvider({
        clientId: getAppleClientId(),
        get clientSecret() {
          return getAppleClientSecret();
        },
        ...TIMEOUT,
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
            image: null,
          };
        },
      }),
  },
  {
    id: "atlassian",
    defaultName: "Atlassian",
    flagEnvs: ["NEXT_PUBLIC_ATLASSIAN_ENABLED"],
    customNameEnv: "ATLASSIAN_CUSTOM_NAME",
    build: oauth(
      AtlassianProvider,
      "ATLASSIAN_CLIENT_ID",
      "ATLASSIAN_CLIENT_SECRET",
      {
        authorization: {
          params: {
            scope:
              "write:jira-work read:jira-work read:jira-user offline_access read:me",
          },
        },
        profile(profile: any) {
          return {
            id: profile.account_id,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            username: profile.account_id,
          };
        },
      }
    ),
  },
  {
    id: "auth0",
    defaultName: "Auth0",
    flagEnvs: ["NEXT_PUBLIC_AUTH0_ENABLED"],
    customNameEnv: "AUTH0_CUSTOM_NAME",
    build: oauth(Auth0Provider, "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", {
      issuer: process.env.AUTH0_ISSUER,
      ...TIMEOUT,
    }),
  },
  {
    id: "authentik",
    defaultName: "Authentik",
    flagEnvs: ["NEXT_PUBLIC_AUTHENTIK_ENABLED"],
    customNameEnv: "AUTHENTIK_CUSTOM_NAME",
    build: oauth(
      AuthentikProvider,
      "AUTHENTIK_CLIENT_ID",
      "AUTHENTIK_CLIENT_SECRET",
      {
        issuer: process.env.AUTHENTIK_ISSUER,
        ...TIMEOUT,
        profile: oidcUserProfile,
      }
    ),
  },
  {
    id: "azure-ad-b2c",
    defaultName: "Azure AD B2C",
    flagEnvs: ["NEXT_PUBLIC_AZURE_AD_B2C_ENABLED"],
    customNameEnv: "AZURE_AD_B2C_CUSTOM_NAME",
    build: oauth(
      AzureAdB2CProvider,
      "AZURE_AD_B2C_CLIENT_ID",
      "AZURE_AD_B2C_CLIENT_SECRET",
      {
        tenantId: process.env.AZURE_AD_B2C_TENANT_NAME,
        primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW,
        authorization: { params: { scope: "offline_access openid" } },
      }
    ),
  },
  {
    id: "azure-ad",
    defaultName: "Azure AD",
    flagEnvs: ["NEXT_PUBLIC_AZURE_AD_ENABLED"],
    customNameEnv: "AZURE_AD_CUSTOM_NAME",
    build: oauth(
      AzureAdProvider,
      "AZURE_AD_CLIENT_ID",
      "AZURE_AD_CLIENT_SECRET",
      {
        tenantId: process.env.AZURE_AD_TENANT_ID,
      }
    ),
  },
  {
    id: "battlenet",
    defaultName: "Battle.net",
    flagEnvs: ["NEXT_PUBLIC_BATTLENET_ENABLED"],
    customNameEnv: "BATTLENET_CUSTOM_NAME",
    build: oauth(
      BattleNetProvider,
      "BATTLENET_CLIENT_ID",
      "BATTLENET_CLIENT_SECRET",
      {
        issuer: process.env.BATTLENET_ISSUER as BattleNetIssuer,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "box",
    defaultName: "Box",
    flagEnvs: ["NEXT_PUBLIC_BOX_ENABLED"],
    customNameEnv: "BOX_CUSTOM_NAME",
    build: oauth(BoxProvider, "BOX_CLIENT_ID", "BOX_CLIENT_SECRET"),
  },
  {
    id: "cognito",
    defaultName: "Cognito",
    flagEnvs: ["NEXT_PUBLIC_COGNITO_ENABLED"],
    customNameEnv: "COGNITO_CUSTOM_NAME",
    build: oauth(
      CognitoProvider,
      "COGNITO_CLIENT_ID",
      "COGNITO_CLIENT_SECRET",
      {
        issuer: process.env.COGNITO_ISSUER,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "coinbase",
    defaultName: "Coinbase",
    flagEnvs: ["NEXT_PUBLIC_COINBASE_ENABLED"],
    customNameEnv: "COINBASE_CUSTOM_NAME",
    build: oauth(
      CoinbaseProvider,
      "COINBASE_CLIENT_ID",
      "COINBASE_CLIENT_SECRET"
    ),
  },
  {
    id: "discord",
    defaultName: "Discord",
    flagEnvs: ["NEXT_PUBLIC_DISCORD_ENABLED"],
    customNameEnv: "DISCORD_CUSTOM_NAME",
    build: oauth(DiscordProvider, "DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"),
  },
  {
    id: "dropbox",
    defaultName: "Dropbox",
    flagEnvs: ["NEXT_PUBLIC_DROPBOX_ENABLED"],
    customNameEnv: "DROPBOX_CUSTOM_NAME",
    build: oauth(DropboxProvider, "DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_SECRET"),
  },
  {
    id: "duende-identityserver6",
    defaultName: "DuendeIdentityServer6",
    flagEnvs: ["NEXT_PUBLIC_DUENDE_IDS6_ENABLED"],
    customNameEnv: "DUENDE_IDS6_CUSTOM_NAME",
    build: oauth(DuendeIDS6Provider, "DUENDE_IDS6_ID", "DUENDE_IDS6_SECRET", {
      issuer: process.env.DUENDE_IDS6_ISSUER,
      ...TIMEOUT,
    }),
  },
  {
    id: "eveonline",
    defaultName: "EVE Online",
    flagEnvs: ["NEXT_PUBLIC_EVEONLINE_ENABLED"],
    customNameEnv: "EVEONLINE_CUSTOM_NAME",
    build: oauth(EVEOnlineProvider, "EVE_CLIENT_ID", "EVE_CLIENT_SECRET"),
  },
  {
    id: "facebook",
    defaultName: "Facebook",
    flagEnvs: ["NEXT_PUBLIC_FACEBOOK_ENABLED"],
    customNameEnv: "FACEBOOK_CUSTOM_NAME",
    build: oauth(
      FacebookProvider,
      "FACEBOOK_CLIENT_ID",
      "FACEBOOK_CLIENT_SECRET"
    ),
  },
  {
    id: "faceit",
    defaultName: "FACEIT",
    flagEnvs: ["NEXT_PUBLIC_FACEIT_ENABLED"],
    customNameEnv: "FACEIT_CUSTOM_NAME",
    build: oauth(FaceItProvider, "FACEIT_CLIENT_ID", "FACEIT_CLIENT_SECRET"),
  },
  {
    id: "foursquare",
    defaultName: "Foursquare",
    flagEnvs: ["NEXT_PUBLIC_FOURSQUARE_ENABLED"],
    customNameEnv: "FOURSQUARE_CUSTOM_NAME",
    build: oauth(
      FourSquareProvider,
      "FOURSQUARE_CLIENT_ID",
      "FOURSQUARE_CLIENT_SECRET",
      {
        apiVersion: process.env.FOURSQUARE_APIVERSION,
      }
    ),
  },
  {
    id: "freshbooks",
    defaultName: "Freshbooks",
    flagEnvs: ["NEXT_PUBLIC_FRESHBOOKS_ENABLED"],
    customNameEnv: "FRESHBOOKS_CUSTOM_NAME",
    build: oauth(
      FreshbooksProvider,
      "FRESHBOOKS_CLIENT_ID",
      "FRESHBOOKS_CLIENT_SECRET"
    ),
  },
  {
    id: "fusionauth",
    defaultName: "FusionAuth",
    flagEnvs: ["NEXT_PUBLIC_FUSIONAUTH_ENABLED"],
    customNameEnv: "FUSIONAUTH_CUSTOM_NAME",
    build: oauth(
      FusionAuthProvider,
      "FUSIONAUTH_CLIENT_ID",
      "FUSIONAUTH_SECRET",
      {
        id: "fusionauth",
        name: "FusionAuth",
        issuer: process.env.FUSIONAUTH_ISSUER,
        tenantId: process.env.FUSIONAUTH_TENANT_ID,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "github",
    defaultName: "GitHub",
    flagEnvs: ["NEXT_PUBLIC_GITHUB_ENABLED"],
    customNameEnv: "GITHUB_CUSTOM_NAME",
    build: oauth(GitHubProvider, "GITHUB_ID", "GITHUB_SECRET", { ...TIMEOUT }),
  },
  {
    id: "gitlab",
    defaultName: "GitLab",
    flagEnvs: ["NEXT_PUBLIC_GITLAB_ENABLED"],
    customNameEnv: "GITLAB_CUSTOM_NAME",
    build: () =>
      GitlabProvider({
        clientId: process.env.GITLAB_CLIENT_ID!,
        clientSecret: process.env.GITLAB_CLIENT_SECRET!,
        ...TIMEOUT,
        authorization: {
          url: `${
            process.env.GITLAB_AUTH_URL || "https://gitlab.com"
          }/oauth/authorize`,
          params: { scope: "read_user" },
        },
        token: `${
          process.env.GITLAB_AUTH_URL || "https://gitlab.com"
        }/oauth/token`,
        userinfo: `${
          process.env.GITLAB_AUTH_URL || "https://gitlab.com"
        }/api/v4/user`,
      }),
  },
  {
    id: "google",
    defaultName: "Google",
    flagEnvs: ["NEXT_PUBLIC_GOOGLE_ENABLED"],
    customNameEnv: "GOOGLE_CUSTOM_NAME",
    build: oauth(GoogleProvider, "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", {
      ...TIMEOUT,
    }),
  },
  {
    id: "hubspot",
    defaultName: "HubSpot",
    flagEnvs: ["NEXT_PUBLIC_HUBSPOT_ENABLED"],
    customNameEnv: "HUBSPOT_CUSTOM_NAME",
    build: oauth(HubspotProvider, "HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET"),
  },
  {
    id: "identity-server4",
    defaultName: "IdentityServer4",
    flagEnvs: ["NEXT_PUBLIC_IDS4_ENABLED"],
    customNameEnv: "IDS4_CUSTOM_NAME",
    build: oauth(
      IdentityServer4Provider,
      "IdentityServer4_CLIENT_ID",
      "IdentityServer4_CLIENT_SECRET",
      {
        id: "identity-server4",
        name: "IdentityServer4",
        issuer: process.env.IdentityServer4_Issuer,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "kakao",
    defaultName: "Kakao",
    flagEnvs: ["NEXT_PUBLIC_KAKAO_ENABLED"],
    customNameEnv: "KAKAO_CUSTOM_NAME",
    build: oauth(KakaoProvider, "KAKAO_CLIENT_ID", "KAKAO_CLIENT_SECRET"),
  },
  {
    id: "keycloak",
    defaultName: "Keycloak",
    flagEnvs: ["NEXT_PUBLIC_KEYCLOAK_ENABLED"],
    customNameEnv: "KEYCLOAK_CUSTOM_NAME",
    build: oauth(
      KeycloakProvider,
      "KEYCLOAK_CLIENT_ID",
      "KEYCLOAK_CLIENT_SECRET",
      {
        issuer: process.env.KEYCLOAK_ISSUER,
        ...TIMEOUT,
        profile: oidcUserProfile,
      }
    ),
  },
  {
    id: "line",
    defaultName: "LINE",
    flagEnvs: ["NEXT_PUBLIC_LINE_ENABLED"],
    customNameEnv: "LINE_CUSTOM_NAME",
    build: oauth(LineProvider, "LINE_CLIENT_ID", "LINE_CLIENT_SECRET"),
  },
  {
    id: "linkedin",
    defaultName: "LinkedIn",
    flagEnvs: ["NEXT_PUBLIC_LINKEDIN_ENABLED"],
    customNameEnv: "LINKEDIN_CUSTOM_NAME",
    build: oauth(
      LinkedInProvider,
      "LINKEDIN_CLIENT_ID",
      "LINKEDIN_CLIENT_SECRET"
    ),
  },
  {
    id: "mailchimp",
    defaultName: "Mailchimp",
    flagEnvs: ["NEXT_PUBLIC_MAILCHIMP_ENABLED"],
    customNameEnv: "MAILCHIMP_CUSTOM_NAME",
    build: oauth(
      MailchimpProvider,
      "MAILCHIMP_CLIENT_ID",
      "MAILCHIMP_CLIENT_SECRET"
    ),
  },
  {
    id: "mailru",
    defaultName: "Mail.ru",
    flagEnvs: ["NEXT_PUBLIC_MAILRU_ENABLED"],
    customNameEnv: "MAILRU_CUSTOM_NAME",
    build: oauth(MailRuProvider, "MAILRU_CLIENT_ID", "MAILRU_CLIENT_SECRET"),
  },
  {
    id: "naver",
    defaultName: "Naver",
    flagEnvs: ["NEXT_PUBLIC_NAVER_ENABLED"],
    customNameEnv: "NAVER_CUSTOM_NAME",
    build: oauth(NaverProvider, "NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"),
  },
  {
    id: "netlify",
    defaultName: "Netlify",
    flagEnvs: ["NEXT_PUBLIC_NETLIFY_ENABLED"],
    customNameEnv: "NETLIFY_CUSTOM_NAME",
    build: oauth(NetlifyProvider, "NETLIFY_CLIENT_ID", "NETLIFY_CLIENT_SECRET"),
  },
  {
    id: "okta",
    defaultName: "Okta",
    flagEnvs: ["NEXT_PUBLIC_OKTA_ENABLED"],
    customNameEnv: "OKTA_CUSTOM_NAME",
    build: oauth(OktaProvider, "OKTA_CLIENT_ID", "OKTA_CLIENT_SECRET", {
      issuer: process.env.OKTA_ISSUER,
      ...TIMEOUT,
    }),
  },
  {
    id: "onelogin",
    defaultName: "OneLogin",
    flagEnvs: ["NEXT_PUBLIC_ONELOGIN_ENABLED"],
    customNameEnv: "ONELOGIN_CUSTOM_NAME",
    build: oauth(
      OneLoginProvider,
      "ONELOGIN_CLIENT_ID",
      "ONELOGIN_CLIENT_SECRET",
      {
        issuer: process.env.ONELOGIN_ISSUER,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "osso",
    defaultName: "Osso",
    flagEnvs: ["NEXT_PUBLIC_OSSO_ENABLED"],
    customNameEnv: "OSSO_CUSTOM_NAME",
    build: oauth(OssoProvider, "OSSO_CLIENT_ID", "OSSO_CLIENT_SECRET", {
      issuer: process.env.OSSO_ISSUER,
      ...TIMEOUT,
    }),
  },
  {
    id: "osu",
    defaultName: "Osu!",
    flagEnvs: ["NEXT_PUBLIC_OSU_ENABLED"],
    customNameEnv: "OSU_CUSTOM_NAME",
    build: oauth(OsuProvider, "OSU_CLIENT_ID", "OSU_CLIENT_SECRET"),
  },
  {
    id: "patreon",
    defaultName: "Patreon",
    flagEnvs: ["NEXT_PUBLIC_PATREON_ENABLED"],
    customNameEnv: "PATREON_CUSTOM_NAME",
    build: oauth(PatreonProvider, "PATREON_ID", "PATREON_SECRET"),
  },
  {
    id: "pinterest",
    defaultName: "Pinterest",
    flagEnvs: ["NEXT_PUBLIC_PINTEREST_ENABLED"],
    customNameEnv: "PINTEREST_CUSTOM_NAME",
    build: oauth(PinterestProvider, "PINTEREST_ID", "PINTEREST_SECRET"),
  },
  {
    id: "pipedrive",
    defaultName: "Pipedrive",
    flagEnvs: ["NEXT_PUBLIC_PIPEDRIVE_ENABLED"],
    customNameEnv: "PIPEDRIVE_CUSTOM_NAME",
    build: oauth(
      PipedriveProvider,
      "PIPEDRIVE_CLIENT_ID",
      "PIPEDRIVE_CLIENT_SECRET"
    ),
  },
  {
    id: "reddit",
    defaultName: "Reddit",
    flagEnvs: ["NEXT_PUBLIC_REDDIT_ENABLED"],
    customNameEnv: "REDDIT_CUSTOM_NAME",
    build: oauth(RedditProvider, "REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"),
  },
  {
    id: "salesforce",
    defaultName: "Salesforce",
    flagEnvs: ["NEXT_PUBLIC_SALESFORCE_ENABLED"],
    customNameEnv: "SALESFORCE_CUSTOM_NAME",
    build: oauth(
      SalesforceProvider,
      "SALESFORCE_CLIENT_ID",
      "SALESFORCE_CLIENT_SECRET"
    ),
  },
  {
    id: "slack",
    defaultName: "Slack",
    flagEnvs: ["NEXT_PUBLIC_SLACK_ENABLED"],
    customNameEnv: "SLACK_CUSTOM_NAME",
    build: oauth(SlackProvider, "SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"),
  },
  {
    id: "spotify",
    defaultName: "Spotify",
    flagEnvs: ["NEXT_PUBLIC_SPOTIFY_ENABLED"],
    customNameEnv: "SPOTIFY_CUSTOM_NAME",
    build: oauth(SpotifyProvider, "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET"),
  },
  {
    id: "strava",
    defaultName: "Strava",
    flagEnvs: ["NEXT_PUBLIC_STRAVA_ENABLED"],
    customNameEnv: "STRAVA_CUSTOM_NAME",
    build: oauth(StravaProvider, "STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"),
  },
  {
    id: "synology",
    defaultName: "Synology",
    flagEnvs: ["NEXT_PUBLIC_SYNOLOGY_ENABLED"],
    customNameEnv: "SYNOLOGY_CUSTOM_NAME",
    build: () =>
      genericOidc({ id: "synology", name: "Synology", envPrefix: "SYNOLOGY" }),
  },
  {
    id: "todoist",
    defaultName: "Todoist",
    flagEnvs: ["NEXT_PUBLIC_TODOIST_ENABLED"],
    customNameEnv: "TODOIST_CUSTOM_NAME",
    build: oauth(TodoistProvider, "TODOIST_ID", "TODOIST_SECRET"),
  },
  {
    id: "twitch",
    defaultName: "Twitch",
    flagEnvs: ["NEXT_PUBLIC_TWITCH_ENABLED"],
    customNameEnv: "TWITCH_CUSTOM_NAME",
    build: oauth(TwitchProvider, "TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET"),
  },
  {
    id: "united-effects",
    defaultName: "United Effects",
    flagEnvs: ["NEXT_PUBLIC_UNITED_EFFECTS_ENABLED"],
    customNameEnv: "UNITED_EFFECTS_CUSTOM_NAME",
    build: oauth(
      UnitedEffectsProvider,
      "UNITED_EFFECTS_CLIENT_ID",
      "UNITED_EFFECTS_CLIENT_SECRET",
      {
        issuer: process.env.UNITED_EFFECTS_ISSUER!,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "vk",
    defaultName: "VK",
    flagEnvs: ["NEXT_PUBLIC_VK_ENABLED"],
    customNameEnv: "VK_CUSTOM_NAME",
    build: oauth(VkProvider, "VK_CLIENT_ID", "VK_CLIENT_SECRET"),
  },
  {
    id: "wikimedia",
    defaultName: "Wikimedia",
    flagEnvs: ["NEXT_PUBLIC_WIKIMEDIA_ENABLED"],
    customNameEnv: "WIKIMEDIA_CUSTOM_NAME",
    build: oauth(
      WikimediaProvider,
      "WIKIMEDIA_CLIENT_ID",
      "WIKIMEDIA_CLIENT_SECRET"
    ),
  },
  {
    id: "wordpress",
    defaultName: "WordPress.com",
    flagEnvs: ["NEXT_PUBLIC_WORDPRESS_ENABLED"],
    customNameEnv: "WORDPRESS_CUSTOM_NAME",
    build: oauth(
      WordpressProvider,
      "WORDPRESS_CLIENT_ID",
      "WORDPRESS_CLIENT_SECRET"
    ),
  },
  {
    id: "yandex",
    defaultName: "Yandex",
    flagEnvs: ["NEXT_PUBLIC_YANDEX_ENABLED"],
    customNameEnv: "YANDEX_CUSTOM_NAME",
    build: oauth(YandexProvider, "YANDEX_CLIENT_ID", "YANDEX_CLIENT_SECRET"),
  },
  {
    id: "zitadel",
    defaultName: "ZITADEL",
    flagEnvs: ["NEXT_PUBLIC_ZITADEL_ENABLED"],
    customNameEnv: "ZITADEL_CUSTOM_NAME",
    build: oauth(
      ZitadelProvider,
      "ZITADEL_CLIENT_ID",
      "ZITADEL_CLIENT_SECRET",
      {
        issuer: process.env.ZITADEL_ISSUER,
        ...TIMEOUT,
      }
    ),
  },
  {
    id: "zoho",
    defaultName: "Zoho",
    flagEnvs: ["NEXT_PUBLIC_ZOHO_ENABLED"],
    customNameEnv: "ZOHO_CUSTOM_NAME",
    build: oauth(ZohoProvider, "ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET"),
  },
  {
    id: "zoom",
    defaultName: "Zoom",
    // NEXT_PUBLIC_ZOOM_ENABLED_ENABLED was a typo that shipped; keep honoring
    // it for existing deployments that set it as a workaround
    flagEnvs: ["NEXT_PUBLIC_ZOOM_ENABLED", "NEXT_PUBLIC_ZOOM_ENABLED_ENABLED"],
    customNameEnv: "ZOOM_CUSTOM_NAME",
    build: oauth(ZoomProvider, "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"),
  },
  {
    id: "authelia",
    defaultName: "Authelia",
    flagEnvs: ["NEXT_PUBLIC_AUTHELIA_ENABLED"],
    customNameEnv: "AUTHELIA_CUSTOM_NAME",
    build: () =>
      genericOidc({
        id: "authelia",
        name: "Authelia",
        envPrefix: "AUTHELIA",
        timeout: true,
      }),
  },
  {
    id: "oidc",
    defaultName: "OIDC",
    flagEnvs: ["NEXT_PUBLIC_OIDC_ENABLED"],
    customNameEnv: "OIDC_CUSTOM_NAME",
    build: () =>
      genericOidc({
        id: "oidc",
        name: process.env.OIDC_CUSTOM_NAME ?? "OIDC",
        envPrefix: "OIDC",
        scope: process.env.OIDC_SCOPES ?? "openid email profile",
        timeout: true,
      }),
  },
];
