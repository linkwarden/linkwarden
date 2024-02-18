import React, { useEffect } from "react";
import "@/styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import AuthRedirect from "@/layouts/AuthRedirect";
import { Toaster } from "react-hot-toast";
import { Session } from "next-auth";
import { isPWA } from "@/lib/client/utils";

export default function App({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  useEffect(() => {
    if (isPWA()) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
      document.getElementsByTagName("head")[0].appendChild(meta);
    }
  }, []);

  return (
    <SessionProvider
      session={pageProps.session}
      refetchOnWindowFocus={false}
      basePath="/api/v1/auth"
    >
      <Head>
        <title>Linkwarden</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <AuthRedirect>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            className:
              "border border-sky-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white",
          }}
        />
        <Component {...pageProps} />
      </AuthRedirect>
    </SessionProvider>
  );
}
