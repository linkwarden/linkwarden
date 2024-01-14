declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_SECRET: string;
      DATABASE_URL: string;
      NEXTAUTH_URL: string;
      NEXT_PUBLIC_DISABLE_REGISTRATION?: string;
      PAGINATION_TAKE_COUNT?: string;
      STORAGE_FOLDER?: string;
      AUTOSCROLL_TIMEOUT?: string;
      RE_ARCHIVE_LIMIT?: string;
      NEXT_PUBLIC_MAX_FILE_SIZE?: string;
      MAX_LINKS_PER_USER?: string;
      ARCHIVE_TAKE_COUNT?: string;
      IGNORE_UNAUTHORIZED_CA?: string;

      SPACES_KEY?: string;
      SPACES_SECRET?: string;
      SPACES_ENDPOINT?: string;
      SPACES_BUCKET_NAME?: string;
      SPACES_REGION?: string;
      SPACES_FORCE_PATH_STYLE?: string;

      NEXT_PUBLIC_CREDENTIALS_ENABLED?: string;
      DISABLE_NEW_SSO_USERS?: string;

      NEXT_PUBLIC_EMAIL_PROVIDER?: string;
      EMAIL_FROM?: string;
      EMAIL_SERVER?: string;

      NEXT_PUBLIC_STRIPE?: string;
      STRIPE_SECRET_KEY?: string;
      MONTHLY_PRICE_ID?: string;
      YEARLY_PRICE_ID?: string;
      NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL?: string;
      NEXT_PUBLIC_TRIAL_PERIOD_DAYS?: string;
      BASE_URL?: string;

      //
      // SSO Providers
      //

      // 42 School
      NEXT_PUBLIC_FORTYTWO_ENABLED?: string;
      FORTYTWO_CUSTOM_NAME?: string;
      FORTYTWO_CLIENT_ID?: string;
      FORTYTWO_CLIENT_SECRET?: string;

      // Apple
      NEXT_PUBLIC_APPLE_ENABLED?: string;
      APPLE_CUSTOM_NAME?: string;
      APPLE_ID?: string;
      APPLE_SECRET?: string;

      // Atlassian
      NEXT_PUBLIC_ATLASSIAN_ENABLED?: string;
      ATLASSIAN_CUSTOM_NAME?: string;
      ATLASSIAN_CLIENT_ID?: string;
      ATLASSIAN_CLIENT_SECRET?: string;
      ATLASSIAN_SCOPE?: string;

      // Auth0
      NEXT_PUBLIC_AUTH0_ENABLED?: string;
      AUTH0_CUSTOM_NAME?: string;
      AUTH0_ISSUER?: string;
      AUTH0_CLIENT_SECRET?: string;
      AUTH0_CLIENT_ID?: string;

      // Authelia
      NEXT_PUBLIC_AUTHELIA_ENABLED?: string;
      AUTHELIA_CUSTOM_NAME?: string;
      AUTHELIA_CLIENT_ID?: string;
      AUTHELIA_CLIENT_SECRET?: string;
      AUTHELIA_WELLKNOWN_URL?: string;

      // Authentik
      NEXT_PUBLIC_AUTHENTIK_ENABLED?: string;
      AUTHENTIK_CUSTOM_NAME?: string;
      AUTHENTIK_ISSUER?: string;
      AUTHENTIK_CLIENT_ID?: string;
      AUTHENTIK_CLIENT_SECRET?: string;

      // TODO: Azure AD B2C
      // TODO: Azure AD

      // Battle.net
      NEXT_PUBLIC_BATTLENET_ENABLED?: string;
      BATTLENET_CUSTOM_NAME?: string;
      BATTLENET_CLIENT_ID?: string;
      BATTLENET_CLIENT_SECRET?: string;
      BATLLENET_ISSUER?: string;

      // Box
      NEXT_PUBLIC_BOX_ENABLED?: string;
      BOX_CUSTOM_NAME?: string;
      BOX_CLIENT_ID?: string;
      BOX_CLIENT_SECRET?: string;

      // TODO: BoxyHQ SAML

      // Bungie
      NEXT_PUBLIC_BUNGIE_ENABLED?: string;
      BUNGIE_CUSTOM_NAME?: string;
      BUNGIE_CLIENT_ID?: string;
      BUNGIE_CLIENT_SECRET?: string;
      BUNGIE_API_KEY?: string;

      // Cognito
      NEXT_PUBLIC_COGNITO_ENABLED?: string;
      COGNITO_CUSTOM_NAME?: string;
      COGNITO_CLIENT_ID?: string;
      COGNITO_CLIENT_SECRET?: string;
      COGNITO_ISSUER?: string;

      // Coinbase
      NEXT_PUBLIC_COINBASE_ENABLED?: string;
      COINBASE_CUSTOM_NAME?: string;
      COINBASE_CLIENT_ID?: string;
      COINBASE_CLIENT_SECRET?: string;

      // Discord
      NEXT_PUBLIC_DISCORD_ENABLED?: string;
      DISCORD_CUSTOM_NAME?: string;
      DISCORD_CLIENT_ID?: string;
      DISCORD_CLIENT_SECRET?: string;

      // Dropbox
      NEXT_PUBLIC_DROPBOX_ENABLED?: string;
      DROPBOX_CUSTOM_NAME?: string;
      DROPBOX_CLIENT_ID?: string;
      DROPBOX_CLIENT_SECRET?: string;

      // DuendeIndentityServer6
      NEXT_PUBLIC_DUENDE_IDS6_ENABLED?: string;
      DUENDE_IDS6_CUSTOM_NAME?: string;
      DUENDE_IDS6_CLIENT_ID?: string;
      DUENDE_IDS6_CLIENT_SECRET?: string;
      DUENDE_IDS6_ISSUER?: string;

      // EVE Online
      NEXT_PUBLIC_EVEONLINE_ENABLED?: string;
      EVEONLINE_CUSTOM_NAME?: string;
      EVEONLINE_CLIENT_ID?: string;
      EVEONLINE_CLIENT_SECRET?: string;

      // Facebook
      NEXT_PUBLIC_FACEBOOK_ENABLED?: string;
      FACEBOOK_CUSTOM_NAME?: string;
      FACEBOOK_CLIENT_ID?: string;
      FACEBOOK_CLIENT_SECRET?: string;

      // FACEIT
      NEXT_PUBLIC_FACEIT_ENABLED?: string;
      FACEIT_CUSTOM_NAME?: string;
      FACEIT_CLIENT_ID?: string;
      FACEIT_CLIENT_SECRET?: string;

      // Foursquare
      NEXT_PUBLIC_FOURSQUARE_ENABLED?: string;
      FOURSQUARE_CUSTOM_NAME?: string;
      FOURSQUARE_CLIENT_ID?: string;
      FOURSQUARE_CLIENT_SECRET?: string;
      FOURSQUARE_APIVERSION?: string;

      // Freshbooks
      NEXT_PUBLIC_FRESHBOOKS_ENABLED?: string;
      FRESHBOOKS_CUSTOM_NAME?: string;
      FRESHBOOKS_CLIENT_ID?: string;
      FRESHBOOKS_CLIENT_SECRET?: string;

      // FusionAuth
      NEXT_PUBLIC_FUSIONAUTH_ENABLED?: string;
      FUSIONAUTH_CUSTOM_NAME?: string;
      FUSIONAUTH_CLIENT_ID?: string;
      FUSIONAUTH_CLIENT_SECRET?: string;
      FUSIONAUTH_ISSUER?: string;
      FUSIONAUTH_TENANT_ID?: string;

      // GitHub
      NEXT_PUBLIC_GITHUB_ENABLED?: string;
      GITHUB_CUSTOM_NAME?: string;
      GITHUB_CLIENT_ID?: string;
      GITHUB_CLIENT_SECRET?: string;

      // GitLab
      NEXT_PUBLIC_GITLAB_ENABLED?: string;
      GITLAB_CUSTOM_NAME?: string;
      GITLAB_CLIENT_ID?: string;
      GITLAB_CLIENT_SECRET?: string;

      // Google
      NEXT_PUBLIC_GOOGLE_ENABLED?: string;
      GOOGLE_CUSTOM_NAME?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;

      // HubSpot
      NEXT_PUBLIC_HUBSPOT_ENABLED?: string;
      HUBSPOT_CUSTOM_NAME?: string;
      HUBSPOT_CLIENT_ID?: string;
      HUBSPOT_CLIENT_SECRET?: string;

      // IdentityServer4
      NEXT_PUBLIC_IDS4_ENABLED?: string;
      IDS4_CUSTOM_NAME?: string;
      IDS4_CLIENT_ID?: string;
      IDS4_CLIENT_SECRET?: string;
      IDS4_ISSUER?: string;

      // TODO: Instagram (Doesn't return email)

      // Kakao
      NEXT_PUBLIC_KAKAO_ENABLED?: string;
      KAKAO_CUSTOM_NAME?: string;
      KAKAO_CLIENT_ID?: string;
      KAKAO_CLIENT_SECRET?: string;

      // Keycloak
      NEXT_PUBLIC_KEYCLOAK_ENABLED?: string;
      KEYCLOAK_CUSTOM_NAME?: string;
      KEYCLOAK_ISSUER?: string;
      KEYCLOAK_CLIENT_ID?: string;
      KEYCLOAK_CLIENT_SECRET?: string;

      // LINE
      NEXT_PUBLIC_LINE_ENABLED?: string;
      LINE_CUSTOM_NAME?: string;
      LINE_CLIENT_ID?: string;
      LINE_CLIENT_SECRET?: string;

      // LinkedIn
      NEXT_PUBLIC_LINKEDIN_ENABLED?: string;
      LINKEDIN_CUSTOM_NAME?: string;
      LINKEDIN_CLIENT_ID?: string;
      LINKEDIN_CLIENT_SECRET?: string;

      // Mailchimp
      NEXT_PUBLIC_MAILCHIMP_ENABLED?: string;
      MAILCHIMP_CUSTOM_NAME?: string;
      MAILCHIMP_CLIENT_ID?: string;
      MAILCHIMP_CLIENT_SECRET?: string;

      // Mail.ru
      NEXT_PUBLIC_MAILRU_ENABLED?: string;
      MAILRU_CUSTOM_NAME?: string;
      MAILRU_CLIENT_ID?: string;
      MAILRU_CLIENT_SECRET?: string;

      // TODO: Medium (Doesn't return email)

      // Naver
      NEXT_PUBLIC_NAVER_ENABLED?: string;
      NAVER_CUSTOM_NAME?: string;
      NAVER_CLIENT_ID?: string;
      NAVER_CLIENT_SECRET?: string;

      // Netlify
      NEXT_PUBLIC_NETLIFY_ENABLED?: string;
      NETLIFY_CUSTOM_NAME?: string;
      NETLIFY_CLIENT_ID?: string;
      NETLIFY_CLIENT_SECRET?: string;

      // Okta
      NEXT_PUBLIC_OKTA_ENABLED?: string;
      OKTA_CUSTOM_NAME?: string;
      OKTA_CLIENT_ID?: string;
      OKTA_CLIENT_SECRET?: string;
      OKTA_ISSUER?: string;

      // OneLogin
      NEXT_PUBLIC_ONELOGIN_ENABLED?: string;
      ONELOGIN_CUSTOM_NAME?: string;
      ONELOGIN_CLIENT_ID?: string;
      ONELOGIN_CLIENT_SECRET?: string;
      ONELOGIN_ISSUER?: string;

      // Osso
      NEXT_PUBLIC_OSSO_ENABLED?: string;
      OSSO_CUSTOM_NAME?: string;
      OSSO_CLIENT_ID?: string;
      OSSO_CLIENT_SECRET?: string;
      OSSO_ISSUER?: string;

      // osu!
      NEXT_PUBLIC_OSU_ENABLED?: string;
      OSU_CUSTOM_NAME?: string;
      OSU_CLIENT_ID?: string;
      OSU_CLIENT_SECRET?: string;

      // Patreon
      NEXT_PUBLIC_PATREON_ENABLED?: string;
      PATREON_CUSTOM_NAME?: string;
      PATREON_CLIENT_ID?: string;
      PATREON_CLIENT_SECRET?: string;

      // Pinterest
      NEXT_PUBLIC_PINTEREST_ENABLED?: string;
      PINTEREST_CUSTOM_NAME?: string;
      PINTEREST_CLIENT_ID?: string;
      PINTEREST_CLIENT_SECRET?: string;

      // Pipedrive
      NEXT_PUBLIC_PIPEDRIVE_ENABLED?: string;
      PIPEDRIVE_CUSTOM_NAME?: string;
      PIPEDRIVE_CLIENT_ID?: string;
      PIPEDRIVE_CLIENT_SECRET?: string;

      // Reddit
      // TODO (1h tokens)
      NEXT_PUBLIC_REDDIT_ENABLED?: string;
      REDDIT_CUSTOM_NAME?: string;
      REDDIT_CLIENT_ID?: string;
      REDDIT_CLIENT_SECRET?: string;

      // Salesforce
      NEXT_PUBLIC_SALESFORCE_ENABLED?: string;
      SALESFORCE_CUSTOM_NAME?: string;
      SALESFORCE_CLIENT_ID?: string;
      SALESFORCE_CLIENT_SECRET?: string;

      // Slack
      NEXT_PUBLIC_SLACK_ENABLED?: string;
      SLACK_CUSTOM_NAME?: string;
      SLACK_CLIENT_ID?: string;
      SLACK_CLIENT_SECRET?: string;

      // Spotify
      NEXT_PUBLIC_SPOTIFY_ENABLED?: string;
      SPOTIFY_CUSTOM_NAME?: string;
      SPOTIFY_CLIENT_ID?: string;
      SPOTIFY_CLIENT_SECRET?: string;

      // Strava
      NEXT_PUBLIC_STRAVA_ENABLED?: string;
      STRAVA_CUSTOM_NAME?: string;
      STRAVA_CLIENT_ID?: string;
      STRAVA_CLIENT_SECRET?: string;

      // Todoist
      NEXT_PUBLIC_TODOIST_ENABLED?: string;
      TODOIST_CUSTOM_NAME?: string;
      TODOIST_CLIENT_ID?: string;
      TODOIST_CLIENT_SECRET?: string;

      // TODO: Trakt (Doesn't return email)

      // Twitch
      NEXT_PUBLIC_TWITCH_ENABLED?: string;
      TWITCH_CUSTOM_NAME?: string;
      TWITCH_CLIENT_ID?: string;
      TWITCH_CLIENT_SECRET?: string;

      // TODO: Twitter (OAuth 1.0)

      // United Effects
      NEXT_PUBLIC_UNITED_EFFECTS_ENABLED?: string;
      UNITED_EFFECTS_CUSTOM_NAME?: string;
      UNITED_EFFECTS_CLIENT_ID?: string;
      UNITED_EFFECTS_CLIENT_SECRET?: string;
      UNITED_EFFECTS_ISSUER?: string;

      // VK
      NEXT_PUBLIC_VK_ENABLED?: string;
      VK_CUSTOM_NAME?: string;
      VK_CLIENT_ID?: string;
      VK_CLIENT_SECRET?: string;

      // Wikimedia
      NEXT_PUBLIC_WIKIMEDIA_ENABLED?: string;
      WIKIMEDIA_CUSTOM_NAME?: string;
      WIKIMEDIA_CLIENT_ID?: string;
      WIKIMEDIA_CLIENT_SECRET?: string;

      // Wordpress.com
      NEXT_PUBLIC_WORDPRESS_ENABLED?: string;
      WORDPRESS_CUSTOM_NAME?: string;
      WORDPRESS_CLIENT_ID?: string;
      WORDPRESS_CLIENT_SECRET?: string;

      // TODO: WorkOS (Custom flow)

      // Yandex
      NEXT_PUBLIC_YANDEX_ENABLED?: string;
      YANDEX_CUSTOM_NAME?: string;
      YANDEX_CLIENT_ID?: string;
      YANDEX_CLIENT_SECRET?: string;

      // Zitadel
      NEXT_PUBLIC_ZITADEL_ENABLED?: string;
      ZITADEL_CUSTOM_NAME?: string;
      ZITADEL_CLIENT_ID?: string;
      ZITADEL_CLIENT_SECRET?: string;
      ZITADEL_ISSUER?: string;

      // Zoho
      NEXT_PUBLIC_ZOHO_ENABLED?: string;
      ZOHO_CUSTOM_NAME?: string;
      ZOHO_CLIENT_ID?: string;
      ZOHO_CLIENT_SECRET?: string;

      // Zoom
      NEXT_PUBLIC_ZOOM_ENABLED?: string;
      ZOOM_CUSTOM_NAME?: string;
      ZOOM_CLIENT_ID?: string;
      ZOOM_CLIENT_SECRET?: string;
    }
  }
}

export { };
