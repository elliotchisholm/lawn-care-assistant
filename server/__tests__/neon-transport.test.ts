import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchNeonBatch } from "../neonTransport";

describe("Neon transaction response compatibility", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("preserves SQL errors and constraint names instead of returning a mapping error", async () => {
    const failure = { fields: null, rows: null, code: "23505", severity: "ERROR",
      message: "duplicate key", constraint: "applied_weeks_user_id_week_number_key" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ results: [failure] })));
    const response = await fetchNeonBatch("https://sql.example.test");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(failure);
  });
  it("preserves true and false for the driver's PostgreSQL boolean parser", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ results: [
      { fields: [{ dataTypeID: 16 }, { dataTypeID: 3802 }], rows: [[true, '{"flag":true}'], [false, null]] },
    ] })));
    const response = await fetchNeonBatch("https://sql.example.test");
    expect((await response.json()).results[0].rows).toEqual([["t", '{"flag":true}'], ["f", null]]);
  });
  it("does not turn rollback errors without a SQLSTATE into successful empty results", async () => {
    const failure = { fields: null, rows: null, code: "", severity: "ERROR",
      message: "commit unexpectedly resulted in rollback" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ results: [failure] })));
    const response = await fetchNeonBatch("https://sql.example.test");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(failure);
  });
  it("leaves standard responses and upstream HTTP failures unchanged", async () => {
    for (const response of [Response.json({ fields: [], rows: [] }), Response.json({ message: "down" }, { status: 503 })]) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
      expect(await fetchNeonBatch("https://sql.example.test")).toBe(response);
    }
  });
});
