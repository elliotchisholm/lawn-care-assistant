import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocked = vi.hoisted(() => ({ select: vi.fn(), update: vi.fn() }));
vi.mock("../db", () => ({ db: mocked }));
import { upgradeLegacySessions } from "../legacySessions";

function simulateConcurrentUpgrade(error: Error) {
  let countQueries = 0;
  mocked.select.mockImplementation(fields => ({
    from: () => ({
      where: () => fields
        ? Promise.resolve([{ remaining: countQueries++ === 0 ? 1 : 0 }])
        : { limit: () => Promise.reject(error) },
    }),
  }));
}

describe("Concurrent legacy session upgrade", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    mocked.select.mockReset();
    mocked.update.mockReset();
  });

  it("handles only the known empty-result signature when another instance finishes first", async () => {
    simulateConcurrentUpgrade(new Error("query failed", {
      cause: new TypeError("Cannot read properties of null (reading 'map')"),
    }));
    expect(await upgradeLegacySessions()).toBe(0);
    expect(mocked.update).not.toHaveBeenCalled();
  });

  it("does not hide genuine database failures", async () => {
    const error = new Error("database unavailable");
    simulateConcurrentUpgrade(error);
    await expect(upgradeLegacySessions()).rejects.toBe(error);
  });

  it("sanitizes a malformed identity without blocking valid session encryption", async () => {
    vi.stubEnv("SESSION_SECRET", "legacy-upgrade-unit-test-only-secret");
    let counts = 0;
    const values: any[] = [];
    mocked.select.mockImplementation(fields => ({
      from: () => ({
        where: () => fields
          ? Promise.resolve([{ remaining: counts++ === 0 ? 2 : 0 }])
          : { limit: async () => [
            { sid: "invalid", sess: { cookie: { maxAge: 123 }, other: "preserved",
              passport: { user: { refresh_token: "invalid-identity-token" } } } },
            { sid: "valid", sess: { passport: { user: {
              claims: { sub: "valid-subject" }, expires_at: 123,
              refresh_token: "valid-test-refresh", access_token: "unused",
            } } } },
          ] },
      }),
    }));
    mocked.update.mockImplementation(() => ({
      set: (value: any) => ({ where: async () => { values.push(value); } }),
    }));
    expect(await upgradeLegacySessions()).toBe(2);
    expect(values[0].sess).toMatchObject({ cookie: { maxAge: 123 }, other: "preserved" });
    expect(values[0].sess.passport).not.toHaveProperty("user");
    expect(values[1].sess.passport.user.encrypted_refresh_token).toMatch(/^v1\./);
    expect(values[1].sess.passport.user).not.toHaveProperty("refresh_token");
    expect(values[1].sess.passport.user).not.toHaveProperty("access_token");
  });
});
