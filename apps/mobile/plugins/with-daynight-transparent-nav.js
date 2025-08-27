const { withAndroidStyles } = require("@expo/config-plugins");
function mutateStylesXml(xml) {
  const styles = xml.resources?.style ?? [];
  let appTheme = styles.find((s) => s.$?.name === "AppTheme");
  if (!appTheme) {
    appTheme = {
      $: { name: "AppTheme", parent: "Theme.AppCompat.DayNight.NoActionBar" },
      item: [],
    };
    styles.push(appTheme);
  }

  appTheme.$ = appTheme.$ || {};
  appTheme.$.parent = "Theme.AppCompat.DayNight.NoActionBar";

  appTheme.item = appTheme.item ?? [];

  appTheme.item = appTheme.item.filter(
    (i) => i?.$?.name !== "android:textColor"
  );

  const navItem = appTheme.item.find(
    (i) => i.$?.name === "android:navigationBarColor"
  );
  if (navItem) {
    navItem._ = "@android:color/transparent";
  } else {
    appTheme.item.push({
      $: { name: "android:navigationBarColor" },
      _: "@android:color/transparent",
    });
  }

  xml.resources.style = styles;
  return xml;
}

module.exports = function withDayNightTransparentNav(config) {
  return withAndroidStyles(config, (c) => {
    c.modResults = mutateStylesXml(c.modResults);
    return c;
  });
};
