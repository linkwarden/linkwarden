import axios, { AxiosError } from "axios"

axios.defaults.baseURL = "http://localhost:3000"

export async function seedUser (username?: string, password?: string, name?: string) {
  try {
    return await axios.post("/api/v1/users", {
      username: username || "test",
      password: password || "password",
      name: name || "Test User",
    })
  } catch (e: any) {
    if (e instanceof AxiosError) {
      if (e.response?.status === 400) {
        return
      }
    }
    throw e
  }
}