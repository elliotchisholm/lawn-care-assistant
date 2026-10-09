---
name: Security replacement verification
description: Evidence required when replacing an unpatched dependency with a fork.
---

Do not treat a clean dependency audit as sufficient proof that a renamed fork
fixes its upstream vulnerability. Inspect the actual security guard and retain
regression tests for the original attack paths, including direct AST input when
the library exposes it.

**Why:** Upstream braces had no patched release, requiring a compatible
derivative. Dependency scanners associate advisories with package names and may
not attribute the upstream flaw to a renamed derivative.

**How to apply:** When changing a security-related replacement, verify both
attack rejection and ordinary parent-package behavior. Prefer a compatible
official patched release when available.
