import axios, { AxiosError } from "axios"

axios.defaults.baseURL = "http://localhost:3000"

export async function seedUser(username?: string, password?: string, name?: string) {
  try {
    return await axios.post("/api/v1/users", {
      username: username || "test",
      password: password || "password",
      name: name || "Test User",
    })
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError && axiosError.response?.status === 400) return

    throw error
  }
}