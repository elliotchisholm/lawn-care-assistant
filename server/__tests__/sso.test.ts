import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

const auth = vi.hoisted(() => ({
  mode: "success" as "success" | "denied" | "error",
  authenticate: vi.fn(),
}));

vi.mock("openid-client", () => ({
  discovery: vi.fn().mockResolvedValue({}),
}));
vi.mock("openid-client/passport", () => ({
  Strategy: class {},
}));
vi.mock("../storage", () => ({ storage: {} }));
vi.mock("express-session", () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock("connect-pg-simple", () => ({
  default: () => class {},
}));
vi.mock("passport", () => ({
  default: {
    initialize: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    session: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    use: vi.fn(),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
    authenticate: auth.authenticate,
  },
}));

describe("SSO redirect policy", () => {
  let app: Express;

  beforeAll(async () => {
    vi.stubEnv("REPLIT_DOMAINS", "sso.example.test");
    vi.stubEnv("REPL_ID", "test-repl");
    // The shared API-test setup mocks auth; exercise the actual route definitions here.
    const { setupAuth } = await vi.importActual<typeof import("../replitAuth")>("../replitAuth");
    app = express();
    await setupAuth(app);
  });

  beforeEach(() => {
    auth.mode = "success";
    auth.authenticate.mockReset();
    auth.authenticate.mockImplementation((_strategy, options) =>
      (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (req.path === "/api/login") {
          return res.redirect("https://provider.example/authorize");
        }
        if (auth.mode === "error") return next(new Error("provider failure"));
        return res.redirect(auth.mode === "denied"
          ? options.failureRedirect
          : options.successReturnToOrRedirect);
      });
  });

  it("does not force fresh login or repeated consent, while preserving the existing scopes", async () => {
    const response = await request(app).get("/api/login").set("Host", "sso.example.test");
    expect(response.status).toBe(302);
    expect(auth.authenticate).toHaveBeenCalledWith("replitauth:sso.example.test", {
      scope: ["openid", "email", "profile", "offline_access"],
    });
    expect(auth.authenticate.mock.calls[0][1]).not.toHaveProperty("prompt");
  });

  it("returns successful sign-ins to the app", async () => {
    const response = await request(app).get("/api/callback").set("Host", "sso.example.test");
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/");
  });

  it("returns denied sign-ins home instead of automatically restarting login", async () => {
    auth.mode = "denied";
    const response = await request(app).get("/api/callback").set("Host", "sso.example.test");
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/?auth_error=sign_in_failed");
  });

  it("handles callback errors without exposing provider details or restarting login", async () => {
    auth.mode = "error";
    const response = await request(app).get("/api/callback").set("Host", "sso.example.test");
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe("/?auth_error=sign_in_failed");
    expect(response.text).not.toContain("provider failure");
  });
});
