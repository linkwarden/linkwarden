// Creates an account with an unverified email through the API, the way
// signing up on the web does, so a flow can start from the login screen.
const response = http.post(BASE_URL + "/api/v1/users", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Maestro",
    username: USERNAME,
    email: EMAIL,
    password: PASSWORD,
  }),
});

output.created = response.status;
