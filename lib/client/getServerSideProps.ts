import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { i18n } from "next-i18next.config";
import { getToken } from "next-auth/jwt";
import { prisma } from "../api/db";

// Keep this in a separate file, it's for logged out users
// For logged in users, we'll use their preferred language from the database (default: en)
const getServerSideProps: GetServerSideProps = async (ctx) => {
  const acceptLanguageHeader = ctx.req.headers["accept-language"];
  const availableLanguages = i18n.locales;

  // Check if it's a logged in user
  // If it is, get the user's preferred language from the database
  const token = await getToken({ req: ctx.req });

  if (token) {
    const user = await prisma.user.findUnique({
      where: {
        id: token.id,
      },
    });

    if (user) {
      return {
        props: {
          ...(await serverSideTranslations(user.locale ?? "en", ["common"])),
        },
      };
    }
  }

  // Parse the accept-language header to get an array of languages
  const acceptedLanguages = acceptLanguageHeader
    ?.split(",")
    .map((lang) => lang.split(";")[0]);

  // Find the best match between the accepted languages and available languages
  let bestMatch = acceptedLanguages?.find((lang) =>
    availableLanguages.includes(lang)
  );

  // If no direct match, find the best partial match
  if (!bestMatch) {
    acceptedLanguages?.some((acceptedLang) => {
      const partialMatch = availableLanguages.find((lang) =>
        lang.startsWith(acceptedLang)
      );
      if (partialMatch) {
        bestMatch = partialMatch;
        return true;
      }
      return false;
    });
  }

  return {
    props: {
      ...(await serverSideTranslations(bestMatch ?? "en", ["common"])),
    },
  };
};

export default getServerSideProps;
