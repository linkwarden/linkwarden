// Adds or removes a link for USERNAME through the API.
// ACTION "create" saves URL as a link named NAME and sets output.linkId.
// ACTION "delete" deletes the link with the id LINK_ID.
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

if (ACTION === "create") {
  const link = http.post(BASE_URL + "/api/v1/links", {
    headers: headers,
    body: JSON.stringify({ url: URL, name: NAME }),
  });
  output.linkId = json(link.body).response.id;
} else {
  http.delete(BASE_URL + "/api/v1/links/" + LINK_ID, { headers: headers });
}

// Sign this check session out so the sign-out flow doesn't count it as one of
// the app's sessions (its look-back window can reach into the previous flow)
http.request(BASE_URL + "/api/v1/session", {
  method: "DELETE",
  headers: headers,
});
