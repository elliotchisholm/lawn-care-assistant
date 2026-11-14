import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";

// setup.ts mocks ../auth for the route tests; these tests exercise the real module.
vi.unmock("../auth");

const storageMock = vi.hoisted(() => ({
  getUser: vi.fn(),
  upsertUser: vi.fn(),
  initializeUserInventory: vi.fn(),
}));
vi.mock("../storage", () => ({ storage: storageMock }));

// Use express-session's in-memory store so no database is needed.
vi.mock("connect-pg-simple", () => ({
  default: (session: any) => session.MemoryStore,
}));

const PASSWORD = "correct horse battery staple";
const OWNER = "owner-user-id";

async function buildApp(): Promise<{ app: Express; auth: typeof import("../auth") }> {
  vi.resetModules(); // fresh in-memory rate limit state per test
  const auth = await import("../auth");
  const app = express();
  app.use(express.json());
  auth.setupAuth(app);
  app.get("/api/protected", auth.isAuthenticated, (req, res) => {
    res.json({ sub: req.user?.claims.sub });
  });
  return { app, auth };
}

const login = (app: Express, password: string, ip = "198.51.100.1") =>
  request(app).post("/api/login").set("X-Forwarded-For", ip).send({ password });

describe("auth", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", "test-secret");
    vi.stubEnv("APP_PASSWORD", PASSWORD);
    vi.stubEnv("OWNER_USER_ID", OWNER);
    vi.stubEnv("NODE_ENV", "test");
    storageMock.getUser.mockReset().mockResolvedValue({ id: OWNER });
    storageMock.upsertUser.mockReset().mockResolvedValue({ id: OWNER });
    storageMock.initializeUserInventory.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  describe("setupAuth configuration", () => {
    it("does not throw on import when env vars are missing", async () => {
      vi.stubEnv("SESSION_SECRET", "");
      vi.stubEnv("APP_PASSWORD", "");
      vi.stubEnv("OWNER_USER_ID", "");
      vi.resetModules();
      await expect(import("../auth")).resolves.toBeDefined();
    });

    it.each(["SESSION_SECRET", "APP_PASSWORD", "OWNER_USER_ID"])(
      "throws a clear error when %s is missing",
      async (name) => {
        vi.stubEnv(name, "");
        vi.resetModules();
        const auth = await import("../auth");
        expect(() => auth.setupAuth(express())).toThrow(`${name} is required`);
      },
    );
  });

  describe("POST /api/login", () => {
    it("rejects a wrong password with 401 and creates no user", async () => {
      const { app } = await buildApp();
      const res = await login(app, "wrong");
      expect(res.status).toBe(401);
      expect(storageMock.upsertUser).not.toHaveBeenCalled();
      expect(storageMock.initializeUserInventory).not.toHaveBeenCalled();
    });

    it.each([undefined, null, 123, ["a"], {}])("rejects a non-string password (%j)", async (value) => {
      const { app } = await buildApp();
      const res = await request(app).post("/api/login").send({ password: value });
      expect(res.status).toBe(401);
    });

    it("rejects a missing body", async () => {
      const { app } = await buildApp();
      expect((await request(app).post("/api/login")).status).toBe(401);
    });

    it("accepts the correct password, creates the owner, and initializes inventory", async () => {
      storageMock.getUser.mockResolvedValue(undefined);
      const { app } = await buildApp();
      const res = await login(app, PASSWORD);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(storageMock.upsertUser).toHaveBeenCalledWith({ id: OWNER });
      expect(storageMock.initializeUserInventory).toHaveBeenCalledWith(OWNER);
    });

    it("does not recreate an existing owner", async () => {
      const { app } = await buildApp();
      await login(app, PASSWORD).expect(200);
      expect(storageMock.upsertUser).not.toHaveBeenCalled();
      expect(storageMock.initializeUserInventory).toHaveBeenCalledWith(OWNER);
    });

    it("returns 500 without a session when the database fails", async () => {
      storageMock.getUser.mockRejectedValue(new Error("db down"));
      const { app } = await buildApp();
      const agent = request.agent(app);
      const res = await agent.post("/api/login").send({ password: PASSWORD });
      expect(res.status).toBe(500);
      await agent.get("/api/protected").expect(401);
    });

    it("sets an httpOnly, SameSite=Lax cookie that is not Secure outside production", async () => {
      const { app } = await buildApp();
      const cookie = (await login(app, PASSWORD)).headers["set-cookie"][0];
      expect(cookie).toContain("connect.sid=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Lax");
      expect(cookie).not.toContain("Secure");
    });

    it("marks the cookie Secure in production", async () => {
      vi.stubEnv("NODE_ENV", "production");
      const { app } = await buildApp();
      const res = await request(app).post("/api/login")
        .set("X-Forwarded-Proto", "https").send({ password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"][0]).toContain("Secure");
    });

    it("issues a fresh session id on every login", async () => {
      const { app } = await buildApp();
      const agent = request.agent(app);
      // A logged-in client that logs in again must not keep its old session id.
      const first = await agent.post("/api/login").send({ password: PASSWORD });
      const firstSid = first.headers["set-cookie"][0].split(";")[0];
      const second = await agent.post("/api/login").send({ password: PASSWORD });
      const secondSid = second.headers["set-cookie"][0].split(";")[0];
      expect(secondSid).not.toBe(firstSid);
    });
  });

  describe("rate limiting", () => {
    it("returns 429 after 5 failed attempts, even for the correct password", async () => {
      const { app } = await buildApp();
      for (let i = 0; i < 5; i++) {
        expect((await login(app, "wrong")).status).toBe(401);
      }
      expect((await login(app, "wrong")).status).toBe(429);
      expect((await login(app, PASSWORD)).status).toBe(429);
    });

    it("tracks attempts per IP", async () => {
      const { app } = await buildApp();
      for (let i = 0; i < 5; i++) await login(app, "wrong", "198.51.100.1");
      expect((await login(app, "wrong", "198.51.100.1")).status).toBe(429);
      expect((await login(app, PASSWORD, "198.51.100.2")).status).toBe(200);
    });

    it("clears the failure count after a successful login", async () => {
      const { app } = await buildApp();
      for (let i = 0; i < 4; i++) await login(app, "wrong");
      await login(app, PASSWORD).expect(200);
      for (let i = 0; i < 4; i++) {
        expect((await login(app, "wrong")).status).toBe(401);
      }
    });

    it("allows attempts again after the 15 minute window", async () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      try {
        const { app } = await buildApp();
        for (let i = 0; i < 5; i++) await login(app, "wrong");
        expect((await login(app, PASSWORD)).status).toBe(429);
        vi.setSystemTime(Date.now() + 15 * 60 * 1000 + 1000);
        expect((await login(app, PASSWORD)).status).toBe(200);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("isAuthenticated", () => {
    it("returns 401 without a session", async () => {
      const { app } = await buildApp();
      const res = await request(app).get("/api/protected");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Unauthorized" });
    });

    it("allows a logged-in session and exposes req.user.claims.sub", async () => {
      const { app } = await buildApp();
      const agent = request.agent(app);
      await agent.post("/api/login").send({ password: PASSWORD }).expect(200);
      const res = await agent.get("/api/protected");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sub: OWNER });
    });

    it("rejects a forged session cookie", async () => {
      const { app } = await buildApp();
      const res = await request(app).get("/api/protected").set("Cookie", "connect.sid=s%3Aforged.invalid");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/logout", () => {
    it("destroys the session and clears the cookie", async () => {
      const { app } = await buildApp();
      const agent = request.agent(app);
      await agent.post("/api/login").send({ password: PASSWORD }).expect(200);
      await agent.get("/api/protected").expect(200);
      const res = await agent.post("/api/logout");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
      expect(res.headers["set-cookie"][0]).toMatch(/connect\.sid=;/);
      await agent.get("/api/protected").expect(401);
    });

    it("succeeds when there is no session", async () => {
      const { app } = await buildApp();
      expect((await request(app).post("/api/logout")).status).toBe(200);
    });
  });
});
