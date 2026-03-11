import { describe, expect, test, vi, beforeEach } from "vitest";

// Mock the process module
vi.mock("process", () => ({
  env: {},
}));

import handler from "./index";
import * as processModule from "process";

describe("logins/index API", () => {
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

  test("returns correct defaults", async () => {
    const req = { method: "GET" };
    const res = mockRes();

    handler(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith({
      credentialsEnabled: "true",
      emailEnabled: "false",
      registrationDisabled: "false",
      buttonAuths: [],
    });
  });

  test("returns enabled providers", async () => {
    processModule.env.NEXT_PUBLIC_GITHUB_ENABLED = "true";
    processModule.env.NEXT_PUBLIC_GOOGLE_ENABLED = "true";
    processModule.env.GOOGLE_CUSTOM_NAME = "Google Login"; // Custom name

    const req = { method: "GET" };
    const res = mockRes();

    handler(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        buttonAuths: expect.arrayContaining([
          { method: "github", name: "GitHub" },
          { method: "google", name: "Google Login" },
        ]),
      })
    );
  });

  test("disables credentials if configured", async () => {
    processModule.env.NEXT_PUBLIC_CREDENTIALS_ENABLED = "false";
    const req = { method: "GET" };
    const res = mockRes();

    handler(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialsEnabled: "false",
      })
    );
  });
});
