import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { signIn } from "next-auth/react";

interface FormData {
  baseURL: string;
  username: string;
  password: string;
}

export default async function sendLoginRequest(form: FormData) {
  if (Capacitor.isNativePlatform()) {
    const csrfToken = await getCsrfToken(form.baseURL);

    const data = {
      username: form.username,
      password: form.password,
      redirect: false,
      csrfToken: csrfToken,
      callbackUrl: `${form.baseURL}/login`,
      json: true,
    };

    const formBody = Object.entries(data)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value as any)}`
      )
      .join("&");

    return await CapacitorHttp.request({
      url: form.baseURL + "/api/v1/auth/callback/credentials",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: formBody,
    });
  } else {
    const response = await signIn("credentials", {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    return response;
  }
}

export async function getCsrfToken(url: string) {
  const token = await CapacitorHttp.request({
    url: `${url}/api/v1/auth/csrf`,
    method: "GET",
  });
  const { csrfToken } = token.data;
  return csrfToken;
}
