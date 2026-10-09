import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { decryptRefreshToken, encryptRefreshToken } from "../sessionTokens";
import { upgradeLegacySessions } from "../legacySessions";
import { applySecurity } from "../security";

const auth = vi.hoisted(() => ({
  mode: "success" as "success" | "denied" | "error",
  authenticate: vi.fn(),
  verify: undefined as any,
  sessionOptions: undefined as any,
  storeOptions: undefined as any,
  serializeUser: vi.fn(),
  deserializeUser: vi.fn(),
  upsertUser: vi.fn(),
  initializeUserInventory: vi.fn(),
  refreshTokenGrant: vi.fn(),
  logout: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("openid-client", () => ({
  discovery: vi.fn().mockResolvedValue({}),
  refreshTokenGrant: auth.refreshTokenGrant,
  buildEndSessionUrl: (_config: unknown, options: any) =>
    new URL(`https://provider.example/logout?return=${encodeURIComponent(options.post_logout_redirect_uri)}`),
}));
vi.mock("openid-client/passport", () => ({
  Strategy: class { constructor(_options: unknown, verify: unknown) { auth.verify = verify; } },
}));
vi.mock("../storage", () => ({ storage: {
  upsertUser: auth.upsertUser,
  initializeUserInventory: auth.initializeUserInventory,
} }));
vi.mock("../legacySessions", () => ({ upgradeLegacySessions: vi.fn().mockResolvedValue(0) }));
vi.mock("express-session", () => ({
  default: (options: any) => {
    auth.sessionOptions = options;
    return (req: any, _res: unknown, next: () => void) => {
      req.session = { destroy: auth.destroy };
      next();
    };
  },
}));
vi.mock("connect-pg-simple", () => ({
  default: () => class { constructor(options: unknown) { auth.storeOptions = options; } },
}));
vi.mock("passport", () => ({
  default: {
    initialize: () => (req: any, _res: unknown, next: () => void) => {
      req.logout = auth.logout;
      next();
    },
    session: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    use: vi.fn(),
    serializeUser: auth.serializeUser,
    deserializeUser: auth.deserializeUser,
    authenticate: auth.authenticate,
  },
}));

describe("SSO redirect policy", () => {
  let app: Express;
  let authenticateUser: typeof import("../replitAuth").isAuthenticated;

  beforeAll(async () => {
    vi.stubEnv("REPLIT_DOMAINS", "sso.example.test");
    vi.stubEnv("ISSUER_URL", "https://provider.example/oidc");
    vi.stubEnv("REPL_ID", "test-repl");
    vi.stubEnv("SESSION_SECRET", "test-only-session-secret");
    // The shared API-test setup mocks auth; exercise the actual route definitions here.
    const { setupAuth, isAuthenticated } = await vi.importActual<typeof import("../replitAuth")>("../replitAuth");
    authenticateUser = isAuthenticated;
    app = express();
    app.set("env", "production");
    applySecurity(app);
    app.get("/logout-test-form", (_req, res) => {
      res.type("html").send('<form method="post" action="/api/logout"><button>Sign out</button></form>');
    });
    await setupAuth(app);
  });
  afterAll(() => vi.unstubAllEnvs());

  beforeEach(() => {
    auth.mode = "success";
    auth.authenticate.mockReset();
    auth.upsertUser.mockReset().mockResolvedValue({ id: "test-sub" });
    auth.initializeUserInventory.mockReset().mockResolvedValue(undefined);
    auth.refreshTokenGrant.mockReset();
    auth.logout.mockReset().mockImplementation(callback => callback());
    auth.destroy.mockReset().mockImplementation(callback => callback());
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

  it("configures secure, HttpOnly, SameSite=Lax cookies and a one-week store TTL in seconds", () => {
    expect(auth.sessionOptions.cookie).toMatchObject({ secure: true, httpOnly: true, sameSite: "lax" });
    expect(auth.storeOptions.ttl).toBe(7 * 24 * 60 * 60);
  });

  it("routes asynchronous user-save errors through Passport's failure callback", async () => {
    const error = new Error("user save failed");
    auth.upsertUser.mockRejectedValueOnce(error);
    const verified = vi.fn();
    await auth.verify({ claims: () => ({ sub: "test-sub", exp: 1000 }) }, verified);
    expect(verified).toHaveBeenCalledWith(error);
  });

  it("does not serialize raw OAuth tokens after successful verification", async () => {
    const verified = vi.fn();
    await auth.verify({
      claims: () => ({ sub: "test-sub", exp: 1000 }),
      access_token: "test-access", refresh_token: "test-refresh",
    }, verified);
    const user = verified.mock.calls[0][1];
    const serialized = vi.fn();
    auth.serializeUser.mock.calls[0][0](user, serialized);
    const stored = serialized.mock.calls[0][1];
    expect(stored).not.toHaveProperty("access_token");
    expect(stored).not.toHaveProperty("refresh_token");
    expect(decryptRefreshToken(stored.encrypted_refresh_token, "test-sub")).toBe("test-refresh");
  });

  it("renews an expired session and saves the rotated encrypted refresh token", async () => {
    const user = {
      claims: { sub: "test-sub" }, expires_at: 1,
      encrypted_refresh_token: encryptRefreshToken("old-refresh", "test-sub"),
    };
    auth.refreshTokenGrant.mockResolvedValue({
      claims: () => undefined, expires_in: 3600,
      access_token: "new-access", refresh_token: "new-refresh",
    });
    const save = vi.fn(callback => callback());
    const req = { user, isAuthenticated: () => true, session: { passport: { user }, save } };
    const next = vi.fn();
    await authenticateUser(req as any, {} as any, next);
    expect(auth.refreshTokenGrant).toHaveBeenCalledWith({}, "old-refresh");
    expect(save).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(req.session.passport.user.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(decryptRefreshToken(req.session.passport.user.encrypted_refresh_token, "test-sub")).toBe("new-refresh");
    expect(req.session.passport.user).not.toHaveProperty("access_token");
  });

  it("does not block startup when legacy-session maintenance fails", async () => {
    vi.mocked(upgradeLegacySessions).mockRejectedValueOnce(new Error("database temporarily unavailable"));
    const { setupAuth } = await vi.importActual<typeof import("../replitAuth")>("../replitAuth");
    const freshApp = express();
    await expect(setupAuth(freshApp)).resolves.toBeUndefined();
    await request(freshApp).get("/api/login").expect(302);
  });

  it("rejects GET logout without ending the session", async () => {
    const response = await request(app).get("/api/logout");
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe("POST");
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it.each([undefined, "same-origin"])(
    "allows a native same-origin logout form through the security stack (Fetch Metadata: %s)",
    async fetchSite => {
      const page = await request(app).get("/logout-test-form").set("Host", "sso.example.test");
      // A no-referrer document policy taints the Origin of native POST navigation
      // to "null". Model that browser behavior, not a hand-picked good header.
      const origin = page.headers["referrer-policy"] === "no-referrer"
        ? "null" : "https://sso.example.test";
      const submission = request(app).post("/api/logout")
        .set("Host", "sso.example.test").set("Origin", origin).type("form").send({});
      if (fetchSite) submission.set("Sec-Fetch-Site", fetchSite);
      const response = await submission;
      expect(response.status).toBe(303);
      expect(page.headers["referrer-policy"]).toBe("same-origin");
      expect(auth.logout).toHaveBeenCalledOnce();
      expect(auth.destroy).toHaveBeenCalledOnce();
      expect(response.headers["set-cookie"][0]).toContain("connect.sid=;");
      expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
      expect(response.headers["set-cookie"][0]).toContain("Secure");
      expect(new URL(response.headers.location).searchParams.get("return"))
        .toBe("https://sso.example.test");
      const formAction = page.headers["content-security-policy"]
        .match(/(?:^|;)\s*form-action ([^;]+)/)?.[1].split(/\s+/);
      expect(formAction).toEqual(["'self'", new URL(response.headers.location).origin]);
    },
  );

  it.each([
    { origin: "https://attacker.example", site: "cross-site" },
    { origin: "https://sso.example.test", site: "cross-site" },
    { origin: "https://attacker.example", site: "same-origin" },
    { origin: "null", site: "same-origin" },
  ])("blocks unsafe logout without changing the session (%j)", async ({ origin, site }) => {
    const response = await request(app).post("/api/logout")
      .set("Host", "sso.example.test").set("Origin", origin).set("Sec-Fetch-Site", site);
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Cross-site request blocked" });
    expect(auth.logout).not.toHaveBeenCalled();
    expect(auth.destroy).not.toHaveBeenCalled();
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("destroys the session on POST logout and uses only a configured return domain", async () => {
    const response = await request(app).post("/api/logout").set("Host", "untrusted.example");
    expect(response.status).toBe(303);
    const target = new URL(response.headers.location);
    expect(target.searchParams.get("return")).toBe("https://sso.example.test");
    expect(auth.logout).toHaveBeenCalledOnce();
    expect(auth.destroy).toHaveBeenCalledOnce();
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Lax");
  });
});
