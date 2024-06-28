import axios, { AxiosError } from "axios"

axios.defaults.baseURL = "http://localhost:3000"

export async function seedUser (username?: string, password?: string, name?: string) {
  try {
    return await axios.post("/api/v1/users", {
      username: username || process.env["TEST_USERNAME"] || "test",
      password: password || process.env["TEST_PASSWORD"] || "password",
      name: name || "Test User",
    })
  } catch (e: any) {
    if (e instanceof AxiosError) {
      if ([400, 500].includes(e.response?.status)) {
        return
      }
    }
    throw e
  }
}