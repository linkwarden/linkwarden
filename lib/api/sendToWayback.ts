import axios from "axios";

export default async function sendToWayback(url: string) {
  const headers = {
    Accept: "text/html,application/xhtml+xml,application/xml",
    "Accept-Encoding": "gzip, deflate",
    Dnt: "1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
  };

  await axios
    .get(`https://web.archive.org/save/${url}`, {
      headers: headers,
    })
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.error(error);
    });
}
