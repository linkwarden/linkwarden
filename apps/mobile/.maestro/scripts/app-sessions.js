// Counts the app sessions USERNAME signed in with since SINCE (a timestamp in
// ms) that the server still accepts, as output.appSessions. It signs in through
// the API to list them, like another device would, and signs that check
// session out again afterwards.
const login = http.post(BASE_URL + "/api/v1/session", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
    sessionName: "Maestro check",
  }),
});
const headers = { Authorization: "Bearer " + json(login.body).response.token };

const tokens = json(
  http.get(BASE_URL + "/api/v1/tokens", { headers: headers }).body
).response;

output.appSessions = tokens.filter(
  (token) =>
    token.isSession &&
    token.name !== "Maestro check" &&
    new Date(token.createdAt).getTime() > Number(SINCE)
).length;

http.request(BASE_URL + "/api/v1/session", {
  method: "DELETE",
  headers: headers,
});
