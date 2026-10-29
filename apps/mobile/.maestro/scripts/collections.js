// Sets up and checks the collections of USERNAME through the API.
// ACTION "create" makes a collection named PARENT with one named CHILD under
// it, and sets output.parentId and output.childId. ACTION "check" sets
// output.childGone and output.parentKept from the collections left, then
// deletes the parent so runs don't pile up on the account.
const session = http.post(BASE_URL + "/api/v1/session", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
});
const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer " + json(session.body).response.token,
};

if (ACTION === "create") {
  const parent = http.post(BASE_URL + "/api/v1/collections", {
    headers: headers,
    body: JSON.stringify({ name: PARENT }),
  });
  output.parentId = json(parent.body).response.id;

  const child = http.post(BASE_URL + "/api/v1/collections", {
    headers: headers,
    body: JSON.stringify({ name: CHILD, parentId: output.parentId }),
  });
  output.childId = json(child.body).response.id;
} else {
  const collections = json(
    http.get(BASE_URL + "/api/v1/collections", { headers: headers }).body
  ).response;

  output.childGone = !collections.some(function (c) {
    return c.id == CHILD_ID;
  });
  output.parentKept = collections.some(function (c) {
    return c.id == PARENT_ID && c.parentId === null;
  });

  http.delete(BASE_URL + "/api/v1/collections/" + PARENT_ID, {
    headers: headers,
  });
}
