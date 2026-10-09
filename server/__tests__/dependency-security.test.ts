import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const micromatchRequire = createRequire(require.resolve("micromatch"));
const proxyaddr = require("proxy-addr");
const qs = require("qs");
const browserslist = require("browserslist");
const expand = require("brace-expansion");
const braces = micromatchRequire("braces");
const micromatch = require("micromatch");
const selectorParser = require("postcss-selector-parser");
const { SourceMapConsumer } = require("source-map-js");

describe("Dependency security regressions", () => {
  it("locks every affected transitive copy to a patched package", () => {
    const lock = JSON.parse(readFileSync(new URL("../../package-lock.json", import.meta.url), "utf8"));
    const patched: Record<string, string> = {
      "proxy-addr": "2.0.8",
      "source-map-js": "1.2.2",
      "brace-expansion": "2.1.7",
      browserslist: "4.29.3",
      braces: "3.0.3-pn.3",
      qs: "6.16.0",
      "postcss-selector-parser": "7.1.6",
    };
    for (const [name, version] of Object.entries(patched)) {
      const copies = Object.entries(lock.packages).filter(([path]) =>
        path.endsWith(`node_modules/${name}`));
      expect(copies.length, `${name} must be present`).toBeGreaterThan(0);
      for (const [, metadata] of copies) {
        expect((metadata as any).version, name).toBe(version);
        if (name === "braces") {
          expect((metadata as any).name).toBe("@dieub/braces-depth-guard");
        }
      }
      for (const [path] of copies) {
        const installed = JSON.parse(readFileSync(
          new URL(`../../${path}/package.json`, import.meta.url), "utf8"));
        expect(installed.version, `installed ${path}`).toBe(version);
      }
    }
  });

  it("does not trust arbitrary IPv4 clients through short IPv6 trust subnets", () => {
    for (const subnet of ["::ffff:10.0.0.0/8", "::/1"]) {
      const trust = proxyaddr.compile(subnet);
      expect(trust("203.0.113.1")).toBe(false);
      expect(proxyaddr({
        connection: { remoteAddress: "203.0.113.1" },
        headers: { "x-forwarded-for": "10.0.0.1" },
      }, trust)).toBe("203.0.113.1");
    }
    const trust = proxyaddr.compile("::ffff:10.0.0.0/104");
    expect(trust("10.1.2.3")).toBe(true);
    expect(trust("203.0.113.1")).toBe(false);
  });

  it("rejects malicious indexed source-map offsets before processing them", () => {
    for (const line of [-1, 0.5, 1e12]) {
      expect(() => new SourceMapConsumer({
        version: 3,
        sections: [{
          offset: { line, column: 0 },
          map: { version: 3, sources: [], names: [], mappings: "" },
        }],
      })).toThrow(/offset/i);
    }
    expect(() => new SourceMapConsumer({
      version: 3,
      sections: [{
        offset: { line: 0, column: 0 },
        map: { version: 3, sources: [], names: [], mappings: "" },
      }],
    })).not.toThrow();
  });

  it("handles inherited-object keys in untrusted Browserslist stats", () => {
    for (const key of ["__proto__", "toString", "valueOf", "constructor", "hasOwnProperty"]) {
      const stats = JSON.parse(`{"${key}":{"onekey":5},"chrome":{"100":50}}`);
      expect(browserslist("defaults", { stats }).length).toBeGreaterThan(0);
    }
  });

  it("bounds brace-expansion parsing and nested expansion attack patterns", () => {
    for (const pattern of [
      "{" + "{a},".repeat(7000) + "b}",
      "{{x}," + "a,".repeat(125000) + "b}",
      "{a,".repeat(4000) + "z" + "}".repeat(4000),
      "{".repeat(3200) + "a,b" + "}".repeat(3200),
      "{a}" + "}".repeat(32000) + ",z}",
    ]) {
      expect(() => expand(pattern)).not.toThrow();
    }
    expect(expand("file-{a,b}-{1..2}")).toEqual([
      "file-a-1", "file-a-2", "file-b-1", "file-b-2",
    ]);
  });

  it("rejects deeply nested strings in every braces processor, including nonfinite limits", () => {
    // These inputs are below the original character limit, so length alone is not protection.
    for (const pattern of [
      "{".repeat(2000) + "a,b" + "}".repeat(2000),
      "(".repeat(2000) + "a" + ")".repeat(2000),
    ]) {
      for (const process of [braces.parse, braces.compile, braces.expand, braces.stringify]) {
        for (const maxDepth of [undefined, Infinity, NaN, 1e9]) {
          expect(() => process(pattern, { maxDepth })).toThrow(/exceeds max depth/);
        }
      }
    }
  });

  it("guards direct AST traversal as well as string parsing", () => {
    let ast: any = { type: "text", value: "a" };
    for (let i = 0; i < 200; i++) {
      const parent = { type: "paren", nodes: [ast] };
      ast.parent = parent;
      ast = parent;
    }
    const root = { type: "root", nodes: [ast] };
    ast.parent = root;
    for (const process of [braces.compile, braces.expand, braces.stringify]) {
      expect(() => process(root)).toThrow(/exceeds max depth/);
    }
  });

  it("preserves ordinary brace expansion and the micromatch consumer API", () => {
    expect(braces("src/{client,server}")).toEqual(["src/(client|server)"]);
    expect(braces.expand("file-{01..03}")).toEqual(["file-01", "file-02", "file-03"]);
    expect(micromatch(["a.ts", "b.tsx", "c.js"], "*.{ts,tsx}")).toEqual(["a.ts", "b.tsx"]);
    expect(micromatch.braceExpand("src/{client,server}/*.ts")).toEqual([
      "src/client/*.ts", "src/server/*.ts",
    ]);
  });

  it("safely round-trips attacker-controlled constructor.isBuffer query values", () => {
    const query = "x%5Bconstructor%5D%5BisBuffer%5D=y";
    for (const options of [{ plainObjects: true }, { allowPrototypes: true }]) {
      expect(qs.stringify(qs.parse(query, options))).toBe(query);
    }
  });

  it("enforces comma-array limits on bracket keys as well as plain keys", () => {
    for (const query of ["a[]=1,2,3,4", "a=1,2,3,4"]) {
      expect(() => qs.parse(query, {
        comma: true, arrayLimit: 3, throwOnLimitExceeded: true,
      })).toThrow(RangeError);
    }
  });

  it("parses long flat selectors and preserves ordinary selector serialization", () => {
    const flat = ".a".repeat(20000);
    expect(selectorParser().processSync(flat)).toBe(flat);
    const selector = "a:hover > .item[data-id=\"1\"]";
    expect(selectorParser().processSync(selector)).toBe(selector);
  });
});
