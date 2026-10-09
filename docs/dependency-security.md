# Dependency security overrides

The overrides in `package.json` force patched versions throughout the dependency
tree. Keep them until the parent packages resolve safe versions themselves.

| Package | Resolved version | Reason |
| --- | --- | --- |
| proxy-addr | 2.0.8 | Reject IPv4 matches against improperly specified IPv6 trust subnets |
| source-map-js | 1.2.2 | Validate indexed source-map offsets |
| brace-expansion | 2.1.7 | Bound recursion and pathological rewrite parsing |
| browserslist | 4.29.3 | Safe custom stats and bounded query caches |
| qs | 6.16.0 | Safe buffer detection and comma-array limit enforcement |
| postcss-selector-parser | 7.1.6 | Fix selector parsing complexity and AST serialization recursion |
| braces | npm:@dieub/braces-depth-guard@3.0.3-pn.3 | Guard parsing and recursive AST traversal |

## Braces replacement

Upstream `braces` has no fixed release for GHSA-vfj7-8cjw-p6xm. The pinned npm
alias is a separately maintained MIT-licensed derivative based on upstream's
depth-guard proposal: <https://github.com/micromatch/braces/pull/72>.
Its actual parser and AST walkers have depth guards; the package rename alone
is not the security fix.

The replacement retains the API used by Chokidar and Micromatch. It rejects brace
and parenthesis nesting above 100 levels with a controlled error, rather than
allowing a native stack overflow. Caller-supplied depth limits cannot raise this
cap. This intentionally changes behavior for excessively nested patterns.
It does not provide a general guarantee against expansion-cardinality or
arbitrarily malformed object attacks.

Prefer an official patched upstream release when one becomes available. Before
changing this alias, verify the replacement's guards and the consumer tests;
do not restore unpatched upstream `braces` just to remove the alias.

The fork remains a third-party maintenance dependency; integrity pinning does
not establish future maintainer trust. Its installed entry point and helpers
have no install hooks or network, filesystem, environment, or subprocess
access. Keep the regression tests and review any future version before updating.

## Portable installs

Project `.npmrc` enables `omit-lockfile-registry-resolved`. The lockfile keeps
all package versions and integrity hashes but omits registry tarball URLs.
This lets installs use the configured registry (the Replit firewall here, the
standard npm registry on an ordinary local checkout) instead of requiring an
internal Replit hostname. No pinned version or integrity hash was changed.

## Verification

Run `npx vitest run server/__tests__/dependency-security.test.ts` for regression
coverage of the patched dependencies, including malicious strings and direct AST
traversal for the replacement. Run `bash scripts/run-tests.sh`, `npm run check`
and `npm run build` to verify application compatibility.
