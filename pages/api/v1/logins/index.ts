import type { NextApiRequest, NextApiResponse } from "next";
import * as process from "process";

export type ResponseData = {
  credentialsEnabled: string | undefined;
  emailEnabled: string | undefined;
  registrationDisabled: string | undefined;
  buttonAuths: {
    method: string;
    name: string;
  }[];
};
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.json(getLogins());
}

export function getLogins() {
  const buttonAuths = [];

  // 42 School
  if (process.env.NEXT_PUBLIC_FORTYTWO_ENABLED === "true") {
    buttonAuths.push({
      method: "42-school",
      name: process.env.FORTYTWO_CUSTOM_NAME ?? "42 School",
    });
  }
  // Apple
  if (process.env.NEXT_PUBLIC_APPLE_ENABLED === "true") {
    buttonAuths.push({
      method: "apple",
      name: process.env.APPLE_CUSTOM_NAME ?? "Apple",
    });
  }
  // Atlassian
  if (process.env.NEXT_PUBLIC_ATLASSIAN_ENABLED === "true") {
    buttonAuths.push({
      method: "atlassian",
      name: process.env.ATLASSIAN_CUSTOM_NAME ?? "Atlassian",
    });
  }
  // Auth0
  if (process.env.NEXT_PUBLIC_AUTH0_ENABLED === "true") {
    buttonAuths.push({
      method: "auth0",
      name: process.env.AUTH0_CUSTOM_NAME ?? "Auth0",
    });
  }
  // Authentik
  if (process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === "true") {
    buttonAuths.push({
      method: "authentik",
      name: process.env.AUTHENTIK_CUSTOM_NAME ?? "Authentik",
    });
  }
  // Battle.net
  if (process.env.NEXT_PUBLIC_BATTLENET_ENABLED === "true") {
    buttonAuths.push({
      method: "battlenet",
      name: process.env.BATTLENET_CUSTOM_NAME ?? "Battle.net",
    });
  }
  // Box
  if (process.env.NEXT_PUBLIC_BOX_ENABLED === "true") {
    buttonAuths.push({
      method: "box",
      name: process.env.BOX_CUSTOM_NAME ?? "Box",
    });
  }
  // Cognito
  if (process.env.NEXT_PUBLIC_COGNITO_ENABLED === "true") {
    buttonAuths.push({
      method: "cognito",
      name: process.env.COGNITO_CUSTOM_NAME ?? "Cognito",
    });
  }
  // Coinbase
  if (process.env.NEXT_PUBLIC_COINBASE_ENABLED === "true") {
    buttonAuths.push({
      method: "coinbase",
      name: process.env.COINBASE_CUSTOM_NAME ?? "Coinbase",
    });
  }
  // Discord
  if (process.env.NEXT_PUBLIC_DISCORD_ENABLED === "true") {
    buttonAuths.push({
      method: "discord",
      name: process.env.DISCORD_CUSTOM_NAME ?? "Discord",
    });
  }
  // Dropbox
  if (process.env.NEXT_PUBLIC_DROPBOX_ENABLED === "true") {
    buttonAuths.push({
      method: "dropbox",
      name: process.env.DROPBOX_CUSTOM_NAME ?? "Dropbox",
    });
  }
  // Duende IdentityServer6
  if (process.env.NEXT_PUBLIC_DUENDE_IDS6_ENABLED === "true") {
    buttonAuths.push({
      method: "duende-identityserver6",
      name: process.env.DUENDE_IDS6_CUSTOM_NAME ?? "DuendeIdentityServer6",
    });
  }
  // EVE Online
  if (process.env.NEXT_PUBLIC_EVEONLINE_ENABLED === "true") {
    buttonAuths.push({
      method: "eveonline",
      name: process.env.EVEONLINE_CUSTOM_NAME ?? "EVE Online",
    });
  }
  // Facebook
  if (process.env.NEXT_PUBLIC_FACEBOOK_ENABLED === "true") {
    buttonAuths.push({
      method: "facebook",
      name: process.env.FACEBOOK_CUSTOM_NAME ?? "Facebook",
    });
  }
  // FACEIT
  if (process.env.NEXT_PUBLIC_FACEIT_ENABLED === "true") {
    buttonAuths.push({
      method: "faceit",
      name: process.env.FACEIT_CUSTOM_NAME ?? "FACEIT",
    });
  }
  // Foursquare
  if (process.env.NEXT_PUBLIC_FOURSQUARE_ENABLED === "true") {
    buttonAuths.push({
      method: "foursquare",
      name: process.env.FOURSQUARE_CUSTOM_NAME ?? "Foursquare",
    });
  }
  // Freshbooks
  if (process.env.NEXT_PUBLIC_FRESHBOOKS_ENABLED === "true") {
    buttonAuths.push({
      method: "freshbooks",
      name: process.env.FRESHBOOKS_CUSTOM_NAME ?? "Freshbooks",
    });
  }
  // FusionAuth
  if (process.env.NEXT_PUBLIC_FUSIONAUTH_ENABLED === "true") {
    buttonAuths.push({
      method: "fusionauth",
      name: process.env.FUSIONAUTH_CUSTOM_NAME ?? "FusionAuth",
    });
  }
  // GitHub
  if (process.env.NEXT_PUBLIC_GITHUB_ENABLED === "true") {
    buttonAuths.push({
      method: "github",
      name: process.env.GITHUB_CUSTOM_NAME ?? "GitHub",
    });
  }
  // GitLab
  if (process.env.NEXT_PUBLIC_GITLAB_ENABLED === "true") {
    buttonAuths.push({
      method: "gitlab",
      name: process.env.GITLAB_CUSTOM_NAME ?? "GitLab",
    });
  }
  // Google
  if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true") {
    buttonAuths.push({
      method: "google",
      name: process.env.GOOGLE_CUSTOM_NAME ?? "Google",
    });
  }
  // HubSpot
  if (process.env.NEXT_PUBLIC_HUBSPOT_ENABLED === "true") {
    buttonAuths.push({
      method: "hubspot",
      name: process.env.HUBSPOT_CUSTOM_NAME ?? "HubSpot",
    });
  }
  // IdentityServer4
  if (process.env.NEXT_PUBLIC_IDS4_ENABLED === "true") {
    buttonAuths.push({
      method: "identity-server4",
      name: process.env.IDS4_CUSTOM_NAME ?? "IdentityServer4",
    });
  }
  // Kakao
  if (process.env.NEXT_PUBLIC_KAKAO_ENABLED === "true") {
    buttonAuths.push({
      method: "kakao",
      name: process.env.KAKAO_CUSTOM_NAME ?? "Kakao",
    });
  }
  // Keycloak
  if (process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === "true") {
    buttonAuths.push({
      method: "keycloak",
      name: process.env.KEYCLOAK_CUSTOM_NAME ?? "Keycloak",
    });
  }
  // LINE
  if (process.env.NEXT_PUBLIC_LINE_ENABLED === "true") {
    buttonAuths.push({
      method: "line",
      name: process.env.LINE_CUSTOM_NAME ?? "LINE",
    });
  }
  // LinkedIn
  if (process.env.NEXT_PUBLIC_LINKEDIN_ENABLED === "true") {
    buttonAuths.push({
      method: "linkedin",
      name: process.env.LINKEDIN_CUSTOM_NAME ?? "LinkedIn",
    });
  }
  // MailChimp
  if (process.env.NEXT_PUBLIC_MAILCHIMP_ENABLED === "true") {
    buttonAuths.push({
      method: "mailchimp",
      name: process.env.MAILCHIMP_CUSTOM_NAME ?? "Mailchimp",
    });
  }
  // Mail.ru
  if (process.env.NEXT_PUBLIC_MAILRU_ENABLED === "true") {
    buttonAuths.push({
      method: "mailru",
      name: process.env.MAILRU_CUSTOM_NAME ?? "Mail.ru",
    });
  }
  // Naver
  if (process.env.NEXT_PUBLIC_NAVER_ENABLED === "true") {
    buttonAuths.push({
      method: "naver",
      name: process.env.NAVER_CUSTOM_NAME ?? "Naver",
    });
  }
  // Netlify
  if (process.env.NEXT_PUBLIC_NETLIFY_ENABLED === "true") {
    buttonAuths.push({
      method: "netlify",
      name: process.env.NETLIFY_CUSTOM_NAME ?? "Netlify",
    });
  }
  // Okta
  if (process.env.NEXT_PUBLIC_OKTA_ENABLED === "true") {
    buttonAuths.push({
      method: "okta",
      name: process.env.OKTA_CUSTOM_NAME ?? "Okta",
    });
  }
  // OneLogin
  if (process.env.NEXT_PUBLIC_ONELOGIN_ENABLED === "true") {
    buttonAuths.push({
      method: "onelogin",
      name: process.env.ONELOGIN_CUSTOM_NAME ?? "OneLogin",
    });
  }
  // Osso
  if (process.env.NEXT_PUBLIC_OSSO_ENABLED === "true") {
    buttonAuths.push({
      method: "osso",
      name: process.env.OSSO_CUSTOM_NAME ?? "Osso",
    });
  }
  // osu!
  if (process.env.NEXT_PUBLIC_OSU_ENABLED === "true") {
    buttonAuths.push({
      method: "osu",
      name: process.env.OSU_CUSTOM_NAME ?? "Osu!",
    });
  }
  // Patreon
  if (process.env.NEXT_PUBLIC_PATREON_ENABLED === "true") {
    buttonAuths.push({
      method: "patreon",
      name: process.env.PATREON_CUSTOM_NAME ?? "Patreon",
    });
  }
  // Pinterest
  if (process.env.NEXT_PUBLIC_PINTEREST_ENABLED === "true") {
    buttonAuths.push({
      method: "pinterest",
      name: process.env.PINTEREST_CUSTOM_NAME ?? "Pinterest",
    });
  }
  // Pipedrive
  if (process.env.NEXT_PUBLIC_PIPEDRIVE_ENABLED === "true") {
    buttonAuths.push({
      method: "pipedrive",
      name: process.env.PIPEDRIVE_CUSTOM_NAME ?? "Pipedrive",
    });
  }
  // Reddit
  if (process.env.NEXT_PUBLIC_REDDIT_ENABLED === "true") {
    buttonAuths.push({
      method: "reddit",
      name: process.env.REDDIT_CUSTOM_NAME ?? "Reddit",
    });
  }
  // Salesforce
  if (process.env.NEXT_PUBLIC_SALESFORCE_ENABLED === "true") {
    buttonAuths.push({
      method: "salesforce",
      name: process.env.SALESFORCE_CUSTOM_NAME ?? "Salesforce",
    });
  }
  // Slack
  if (process.env.NEXT_PUBLIC_SLACK_ENABLED === "true") {
    buttonAuths.push({
      method: "slack",
      name: process.env.SLACK_CUSTOM_NAME ?? "Slack",
    });
  }
  // Spotify
  if (process.env.NEXT_PUBLIC_SPOTIFY_ENABLED === "true") {
    buttonAuths.push({
      method: "spotify",
      name: process.env.SPOTIFY_CUSTOM_NAME ?? "Spotify",
    });
  }
  // Strava
  if (process.env.NEXT_PUBLIC_STRAVA_ENABLED === "true") {
    buttonAuths.push({
      method: "strava",
      name: process.env.STRAVA_CUSTOM_NAME ?? "Strava",
    });
  }
  // Todoist
  if (process.env.NEXT_PUBLIC_TODOIST_ENABLED === "true") {
    buttonAuths.push({
      method: "todoist",
      name: process.env.TODOIST_CUSTOM_NAME ?? "Todoist",
    });
  }
  // Twitch
  if (process.env.NEXT_PUBLIC_TWITCH_ENABLED === "true") {
    buttonAuths.push({
      method: "twitch",
      name: process.env.TWITCH_CUSTOM_NAME ?? "Twitch",
    });
  }
  // United Effects
  if (process.env.NEXT_PUBLIC_UNITED_EFFECTS_ENABLED === "true") {
    buttonAuths.push({
      method: "united-effects",
      name: process.env.UNITED_EFFECTS_CUSTOM_NAME ?? "United Effects",
    });
  }
  // VK
  if (process.env.NEXT_PUBLIC_VK_ENABLED === "true") {
    buttonAuths.push({
      method: "vk",
      name: process.env.VK_CUSTOM_NAME ?? "VK",
    });
  }
  // Wikimedia
  if (process.env.NEXT_PUBLIC_WIKIMEDIA_ENABLED === "true") {
    buttonAuths.push({
      method: "wikimedia",
      name: process.env.WIKIMEDIA_CUSTOM_NAME ?? "Wikimedia",
    });
  }
  // Wordpress.com
  if (process.env.NEXT_PUBLIC_WORDPRESS_ENABLED === "true") {
    buttonAuths.push({
      method: "wordpress",
      name: process.env.WORDPRESS_CUSTOM_NAME ?? "WordPress.com",
    });
  }
  // Yandex
  if (process.env.NEXT_PUBLIC_YANDEX_ENABLED === "true") {
    buttonAuths.push({
      method: "yandex",
      name: process.env.YANDEX_CUSTOM_NAME ?? "Yandex",
    });
  }
  // Zitadel
  if (process.env.NEXT_PUBLIC_ZITADEL_ENABLED === "true") {
    buttonAuths.push({
      method: "zitadel",
      name: process.env.ZITADEL_CUSTOM_NAME ?? "ZITADEL",
    });
  }
  // Zoho
  if (process.env.NEXT_PUBLIC_ZOHO_ENABLED === "true") {
    buttonAuths.push({
      method: "zoho",
      name: process.env.ZOHO_CUSTOM_NAME ?? "Zoho",
    });
  }
  // Zoom
  if (process.env.NEXT_PUBLIC_ZOOM_ENABLED === "true") {
    buttonAuths.push({
      method: "zoom",
      name: process.env.ZOOM_CUSTOM_NAME ?? "Zoom",
    });
  }
  // Authelia
  if (process.env.NEXT_PUBLIC_AUTHELIA_ENABLED === "true") {
    buttonAuths.push({
      method: "authelia",
      name: process.env.AUTHELIA_CUSTOM_NAME ?? "Authelia",
    });
  }
  return {
    credentialsEnabled:
      process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED === "true" ||
        process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED === undefined
        ? "true"
        : "false",
    emailEnabled:
      process.env.NEXT_PUBLIC_EMAIL_PROVIDER === "true" ? "true" : "false",
    registrationDisabled:
      process.env.NEXT_PUBLIC_DISABLE_REGISTRATION === "true"
        ? "true"
        : "false",
    buttonAuths: buttonAuths,
  };
}
