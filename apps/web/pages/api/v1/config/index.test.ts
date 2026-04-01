import { describe, expect, test, vi, beforeEach } from "vitest";

// Mock the process module
vi.mock("process", () => ({
  env: {},
}));

import handler from "./index";
import * as processModule from "process";

describe("config/index API", () => {
  beforeEach(() => {
    Object.keys(processModule.env).forEach(
      (key) => delete processModule.env[key]
    );
  });

  const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  test("returns default config (nulls)", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      response: {
        DISABLE_REGISTRATION: null,
        ADMIN: null,
        RSS_POLLING_INTERVAL_MINUTES: null,
        EMAIL_PROVIDER: null,
        MAX_FILE_BUFFER: null,
        AI_ENABLED: null,
        INSTANCE_VERSION: undefined,
      },
    });
  });

  test("returns correct config when env vars are set", async () => {
    processModule.env.NEXT_PUBLIC_DISABLE_REGISTRATION = "true";
    processModule.env.NEXT_PUBLIC_ADMIN = "123";
    processModule.env.NEXT_PUBLIC_RSS_POLLING_INTERVAL_MINUTES = "60";
    processModule.env.NEXT_PUBLIC_EMAIL_PROVIDER = "true";
    processModule.env.NEXT_PUBLIC_MAX_FILE_BUFFER = "50";
    processModule.env.OPENAI_API_KEY = "sk-test";
    processModule.env.version = "1.0.0";

    const req = { method: "GET" };
    const res = mockRes();

    handler(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith({
      response: {
        DISABLE_REGISTRATION: true,
        ADMIN: 123,
        RSS_POLLING_INTERVAL_MINUTES: 60,
        EMAIL_PROVIDER: true,
        MAX_FILE_BUFFER: 50,
        AI_ENABLED: true,
        INSTANCE_VERSION: "1.0.0",
      },
    });
  });

  test("AI_ENABLED checks multiple providers", async () => {
    processModule.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL =
      "http://localhost:11434";
    const req = { method: "GET" };
    const res = mockRes();

    handler(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({
          AI_ENABLED: true,
        }),
      })
    );
  });
});
