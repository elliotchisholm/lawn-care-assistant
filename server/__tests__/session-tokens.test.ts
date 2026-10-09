import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { encryptRefreshToken, decryptRefreshToken, storedSessionUser } from "../sessionTokens";

describe("Session token encryption", () => {
  beforeAll(() => vi.stubEnv("SESSION_SECRET", "test-only-secret-not-used-by-the-app"));
  afterAll(() => vi.unstubAllEnvs());

  it("retains usable refresh tokens without storing them in plaintext", () => {
    const encrypted = encryptRefreshToken("example-refresh-token", "subject-a");
    expect(encrypted).not.toContain("example-refresh-token");
    expect(decryptRefreshToken(encrypted, "subject-a")).toBe("example-refresh-token");
  });

  it("uses a fresh authenticated encryption nonce for each stored token", () => {
    expect(encryptRefreshToken("token", "subject-a")).not.toBe(encryptRefreshToken("token", "subject-a"));
  });

  it("rejects a token substituted from another account", () => {
    const encrypted = encryptRefreshToken("token", "subject-a");
    expect(() => decryptRefreshToken(encrypted, "subject-b")).toThrow();
  });

  it("rejects tampered ciphertext", () => {
    const parts = encryptRefreshToken("token", "subject-a").split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptRefreshToken(parts.join("."), "subject-a")).toThrow();
  });

  it("stores only claims, expiry, and encrypted refresh material", () => {
    const stored = storedSessionUser({
      claims: { sub: "subject-a" }, expires_at: 123,
      access_token: "unused-access-token", refresh_token: "legacy-refresh-token",
      other: "not-for-session",
    });
    expect(stored).not.toHaveProperty("access_token");
    expect(stored).not.toHaveProperty("refresh_token");
    expect(stored).not.toHaveProperty("other");
    expect(JSON.stringify(stored)).not.toContain("legacy-refresh-token");
    expect(decryptRefreshToken(stored.encrypted_refresh_token!, "subject-a")).toBe("legacy-refresh-token");
  });

  it("does not change an already encrypted token when restoring a session", () => {
    const encrypted = encryptRefreshToken("token", "subject-a");
    expect(storedSessionUser({ claims: { sub: "subject-a" }, encrypted_refresh_token: encrypted })
      .encrypted_refresh_token).toBe(encrypted);
  });
});
