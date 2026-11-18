// Sets up and removes what dashboard-stats.yaml opens, for USERNAME through
// the API. ACTION "create" makes a collection named NAME holding a link named
// NAME with a tag named NAME, and sets output.collectionId and output.tagId.
// ACTION "delete" deletes the collection COLLECTION_ID, which takes its link
// with it, and the tag TAG_ID.
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
  const collection = http.post(BASE_URL + "/api/v1/collections", {
    headers: headers,
    body: JSON.stringify({ name: NAME }),
  });
  output.collectionId = json(collection.body).response.id;

  const link = http.post(BASE_URL + "/api/v1/links", {
    headers: headers,
    body: JSON.stringify({
      url: "https://example.com/?maestro-stats=" + Date.now(),
      name: NAME,
      collection: { id: output.collectionId },
      tags: [{ name: NAME }],
    }),
  });
  output.tagId = json(link.body).response.tags[0].id;
} else {
  http.delete(BASE_URL + "/api/v1/collections/" + COLLECTION_ID, {
    headers: headers,
  });
  http.delete(BASE_URL + "/api/v1/tags/" + TAG_ID, { headers: headers });
}

// Sign this check session out so the sign-out flow doesn't count it as one of
// the app's sessions (its look-back window can reach into the previous flow)
http.request(BASE_URL + "/api/v1/session", {
  method: "DELETE",
  headers: headers,
});
