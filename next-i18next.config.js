/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "en",
      "it",
      "fr",
      "zh",
      "zh-TW",
      "uk",
      "pt-BR",
      "ja",
      "es",
      "de",
      "nl",
      "tr",
      "pl",
      "ru",
    ],
  },
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
