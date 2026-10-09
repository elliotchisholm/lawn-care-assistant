---
name: Neon HTTP empty results
description: Compatibility behavior observed between this project's Neon HTTP endpoint and newer Drizzle ORM releases.
---

Treat a Neon HTTP response whose internal rows value is null as an empty result only for queries where an empty result is valid. After mutations, do not assume a RETURNING clause always supplies rows; load the persisted record when the mutation succeeded but returned none.

**Why:** With the current endpoint, empty selects can surface as a null-row mapping error and successful mutations can return no rows. Broadly swallowing database errors would hide genuine failures, so handling must remain narrow.

**How to apply:** When upgrading Drizzle or the Neon driver, re-run database-backed tests that cover missing records and mutation return values. Preserve explicit errors for all signatures other than the known empty-result case.

The current endpoint can also coerce a bound SQL null parameter into an empty string. Use a SQL `NULL` literal when true null semantics are required; do not normalize every empty string globally.

**Why:** A duplicate-email fallback wrote an empty string rather than SQL null, which would block subsequent distinct subjects on the unique email constraint. A database-side `IS NULL` assertion distinguished storage semantics from a nullable field's returned representation.

**How to apply:** For nullable unique fields, test more than one absent value and verify null semantics inside SQL. Keep workarounds narrow instead of changing unrelated database results.

A rejected SDK promise is not proof that a write was rolled back. Verify persisted
state before assuming retries are safe.

**Why:** A batch committed successfully, then response parsing failed in the
client. Retrying a non-idempotent deduction after that error could consume stock
again. The endpoint can also lose the original SQLSTATE when reporting rollback.

**How to apply:** For new transactional writes, test persisted data after an
intentional SQL failure, duplicate retries, and concurrent requests. A transaction
ID check or an HTTP/SDK error alone is insufficient evidence of atomic rollback.