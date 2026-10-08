---
name: Neon HTTP empty results
description: Compatibility behavior observed between this project's Neon HTTP endpoint and newer Drizzle ORM releases.
---

Treat a Neon HTTP response whose internal rows value is null as an empty result only for queries where an empty result is valid. After mutations, do not assume a RETURNING clause always supplies rows; load the persisted record when the mutation succeeded but returned none.

**Why:** With the current endpoint, empty selects can surface as a null-row mapping error and successful mutations can return no rows. Broadly swallowing database errors would hide genuine failures, so handling must remain narrow.

**How to apply:** When upgrading Drizzle or the Neon driver, re-run database-backed tests that cover missing records and mutation return values. Preserve explicit errors for all signatures other than the known empty-result case.