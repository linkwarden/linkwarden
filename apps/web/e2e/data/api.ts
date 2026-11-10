import { APIRequestContext, expect } from "@playwright/test";

export type TestUser = { id: number; username: string; token: string };

export const roles = {
  viewer: { canCreate: false, canUpdate: false, canDelete: false },
  contributor: { canCreate: true, canUpdate: false, canDelete: false },
  admin: { canCreate: true, canUpdate: true, canDelete: true },
};

const unique = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const auth = (user: TestUser) => ({
  Authorization: `Bearer ${user.token}`,
});

export async function createUser(
  request: APIRequestContext,
  role: string
): Promise<TestUser> {
  const username = `e2e-${role}-${unique()}`;
  const password = "password";

  const created = await request.post("/api/v1/users", {
    data: { username, password, name: role },
  });
  expect(created.status()).toBe(201);
  const { response: user } = await created.json();

  const session = await request.post("/api/v1/session", {
    data: { username, password },
  });
  expect(session.ok()).toBeTruthy();
  const { response } = await session.json();

  return { id: user.id, username, token: response.token };
}

export async function createCollection(
  request: APIRequestContext,
  owner: TestUser,
  members: {
    userId: number;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }[] = []
) {
  const name = `e2e-${unique()}`;

  const created = await request.post("/api/v1/collections", {
    headers: auth(owner),
    data: { name },
  });
  expect(created.ok()).toBeTruthy();
  const { response: collection } = await created.json();

  if (members.length > 0) {
    const shared = await request.put(`/api/v1/collections/${collection.id}`, {
      headers: auth(owner),
      data: { id: collection.id, name, members },
    });
    expect(shared.ok()).toBeTruthy();
  }

  return collection as { id: number; ownerId: number };
}

export async function createLink(
  request: APIRequestContext,
  user: TestUser,
  collectionId: number,
  tags: { name: string }[] = []
) {
  // The server never fetches localhost URLs, so creating links makes no outbound requests.
  const created = await request.post("/api/v1/links", {
    headers: auth(user),
    data: {
      url: `http://localhost/e2e-${unique()}`,
      name: "e2e link",
      collection: { id: collectionId },
      tags,
    },
  });
  expect(created.ok()).toBeTruthy();
  const { response: link } = await created.json();

  return link as {
    id: number;
    url: string;
    name: string;
    collectionId: number;
  };
}

export function uniqueTagName(label: string) {
  return `e2e-${label}-${unique()}`;
}

// Format 2 is the PDF archive.
export function uploadPdf(
  request: APIRequestContext,
  user: TestUser,
  linkId: number,
  content: string
) {
  return request.post(`/api/v1/archives/${linkId}?format=2`, {
    headers: auth(user),
    multipart: {
      file: {
        name: "archive.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(`%PDF-1.4\n${content}\n%%EOF\n`),
      },
    },
  });
}

export async function readPdf(
  request: APIRequestContext,
  user: TestUser,
  linkId: number
) {
  const archive = await request.get(`/api/v1/archives/${linkId}?format=2`, {
    headers: auth(user),
  });
  expect(archive.ok()).toBeTruthy();
  return archive.text();
}
