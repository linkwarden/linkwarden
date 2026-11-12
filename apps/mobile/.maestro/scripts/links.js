// Sets output.savedCount to how many of USERNAME's newest links point to URL.
const session = http.post(BASE_URL + "/api/v1/session", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
    sessionName: "Maestro check",
  }),
});
const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer " + json(session.body).response.token,
};

// sort=0 lists the newest links first
const links = json(
  http.get(BASE_URL + "/api/v1/links?sort=0", { headers: headers }).body
).response;

output.savedCount = links.filter(function (link) {
  return link.url === URL;
}).length;

// Sign this check session out so the sign-out flow doesn't count it as one of
// the app's sessions (its look-back window can reach into the previous flow)
http.request(BASE_URL + "/api/v1/session", {
  method: "DELETE",
  headers: headers,
});
