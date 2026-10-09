import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
