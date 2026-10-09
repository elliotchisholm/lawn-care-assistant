import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { applySecurity, requireAdmin, handleRequestError } from "../security";

function testApp(limits = { api: 300, login: 20, writes: 100 }) {
  const app = express();
  app.set("env", "production");
  applySecurity(app, limits);
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/test", (_req, res) => res.json({ ok: true }));
  app.get("/api/login", (_req, res) => res.redirect("/"));
  app.post("/api/test", (_req, res) => res.json({ ok: true }));
  app.get("/api/admin", (req, _res, next) => {
    req.user = { claims: { sub: req.get("X-Test-Subject") } } as any;
    next();
  }, requireAdmin, (_req, res) => res.json({ admin: true }));
  app.get("/api/error", () => { throw new Error("sensitive database details"); });
  app.use(handleRequestError);
  return app;
}

describe("HTTP security protections", () => {
  beforeAll(() => {
    vi.stubEnv("REPLIT_DOMAINS", "app.example.test");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_USER_IDS", "admin-subject");
  });
  afterAll(() => vi.unstubAllEnvs());

  it("sets security headers without blocking the Replit preview", async () => {
    const response = await request(testApp()).get("/api/test");
    expect(response.status).toBe(200);
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["content-security-policy"]).toContain("https://replit.com");
    expect(response.headers["content-security-policy"].match(/script-src [^;]+/)?.[0])
      .not.toContain("'unsafe-inline'");
  });

  it("blocks cross-origin state changes", async () => {
    const response = await request(testApp()).post("/api/test").set("Origin", "https://evil.example").send({});
    expect(response.status).toBe(403);
  });

  it("blocks cross-site browser state changes even without an Origin", async () => {
    expect((await request(testApp()).post("/api/test").set("Sec-Fetch-Site", "cross-site").send({})).status)
      .toBe(403);
  });

  it("accepts requests from the configured app origin", async () => {
    expect((await request(testApp()).post("/api/test").set("Origin", "https://app.example.test").send({})).status)
      .toBe(200);
  });

  it("allows top-level OAuth GET redirects from a provider", async () => {
    expect((await request(testApp()).get("/api/test").set("Sec-Fetch-Site", "cross-site")).status).toBe(200);
  });

  it("limits repeated API requests", async () => {
    const app = testApp({ api: 2, login: 20, writes: 100 });
    await request(app).get("/api/test").expect(200);
    await request(app).get("/api/test").expect(200);
    const response = await request(app).get("/api/test");
    expect(response.status).toBe(429);
    expect(response.headers["retry-after"]).toBeDefined();
  });

  it("limits login requests separately", async () => {
    const app = testApp({ api: 300, login: 1, writes: 100 });
    await request(app).get("/api/login").expect(302);
    await request(app).get("/api/login").expect(429);
  });

  it("limits writes without blocking ordinary reads", async () => {
    const app = testApp({ api: 300, login: 20, writes: 1 });
    await request(app).post("/api/test").send({}).expect(200);
    await request(app).post("/api/test").send({}).expect(429);
    await request(app).get("/api/test").expect(200);
  });

  it("does not treat ordinary accounts as administrators", async () => {
    await request(testApp()).get("/api/admin").set("X-Test-Subject", "regular-user").expect(403);
    await request(testApp()).get("/api/admin").set("X-Test-Subject", "admin-subject").expect(200);
  });

  it("handles malformed JSON and subsequent valid requests without crashing", async () => {
    const app = testApp();
    const response = await request(app).post("/api/test").set("Content-Type", "application/json").send("{bad");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Invalid request" });
    await request(app).get("/api/test").expect(200);
  });

  it("limits body size", async () => {
    await request(testApp()).post("/api/test").send({ text: "x".repeat(40000) }).expect(413);
  });

  it("does not expose internal errors", async () => {
    const response = await request(testApp()).get("/api/error");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal server error" });
  });
});
