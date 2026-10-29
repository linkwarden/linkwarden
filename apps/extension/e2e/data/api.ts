import { APIRequestContext, expect } from "@playwright/test";

export type TestUser = {
  id: number;
  username: string;
  password: string;
  token: string;
};

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// The server never fetches localhost URLs, so saving these makes no outbound
// requests. The fixture serves them to the browser itself.
export const uniqueUrl = () => `http://localhost/e2e-ext-${unique()}`;

export const auth = (user: TestUser) => ({
  Authorization: `Bearer ${user.token}`,
});

export async function createUser(
  request: APIRequestContext
): Promise<TestUser> {
  const username = `e2e-ext-${unique()}`;
  const password = "password";

  const created = await request.post("/api/v1/users", {
    data: { username, password, name: "Extension" },
  });
  expect(created.status()).toBe(201);
  const { response: user } = await created.json();

  const session = await request.post("/api/v1/session", {
    data: { username, password },
  });
  expect(session.ok()).toBeTruthy();
  const { response } = await session.json();

  return { id: user.id, username, password, token: response.token };
}

export async function createCollection(
  request: APIRequestContext,
  user: TestUser,
  name: string,
  parentId?: number
) {
  const created = await request.post("/api/v1/collections", {
    headers: auth(user),
    data: { name, parentId },
  });
  expect(created.ok()).toBeTruthy();
  const { response: collection } = await created.json();

  return collection as { id: number; name: string };
}

export async function createLink(
  request: APIRequestContext,
  user: TestUser,
  url: string
) {
  const created = await request.post("/api/v1/links", {
    headers: auth(user),
    data: { url, name: "Already saved", collection: { name: "Unorganized" } },
  });
  expect(created.ok()).toBeTruthy();
}

export type SavedLink = {
  id: number;
  url: string;
  name: string;
  description: string;
  collection: { id: number; name: string };
};

export async function getLinks(
  request: APIRequestContext,
  user: TestUser
): Promise<SavedLink[]> {
  const links = await request.get("/api/v1/links?sort=0", {
    headers: auth(user),
  });
  expect(links.ok()).toBeTruthy();

  return (await links.json()).response;
}
