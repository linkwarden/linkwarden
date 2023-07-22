declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_SECRET: string;
      DATABASE_URL: string;
      NEXTAUTH_URL: string;
      PAGINATION_TAKE_COUNT?: string;
      STORAGE_FOLDER?: string;

      SPACES_KEY?: string;
      SPACES_SECRET?: string;
      SPACES_ENDPOINT?: string;
      BUCKET_NAME?: string;
      SPACES_REGION?: string;

      NEXT_PUBLIC_EMAIL_PROVIDER?: true;
      EMAIL_FROM?: string;
      EMAIL_SERVER?: string;

      NEXT_PUBLIC_STRIPE_IS_ACTIVE?: string;
      STRIPE_SECRET_KEY?: string;
      PRICE_ID?: string;
      NEXT_PUBLIC_STRIPE_BILLING_PORTAL_URL?: string;
      NEXT_PUBLIC_TRIAL_PERIOD_DAYS?: string;
      BASE_URL?: string;
      NEXT_PUBLIC_PRICING?: string;
    }
  }
}

export {};
