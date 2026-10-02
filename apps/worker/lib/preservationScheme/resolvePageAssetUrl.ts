export const resolvePageAssetUrl = (assetUrl: string, pageOrigin: string) =>
  new URL(assetUrl, pageOrigin).toString();
