export default async function getTitle(url: string) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    // regular expression to find the <title> tag
    let match = text.match(/<title.*>([^<]*)<\/title>/);
    if (match) return match[1];
    else return "";
  } catch (err) {
    console.log(err);
  }
}
