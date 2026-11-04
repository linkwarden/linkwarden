// Sends COUNT wrong passwords for USERNAME, so its next sign-in has to wait.
let failed = 0;

for (let i = 0; i < Number(COUNT); i++) {
  const response = http.post(BASE_URL + "/api/v1/session", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: "wrong-password-" + i,
    }),
  });

  if (response.status === 400) failed++;
}

output.failedLogins = failed;
