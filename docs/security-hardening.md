# Security report fixes

## Access and identity

- User data is scoped to the authenticated OIDC subject, never a body-supplied user ID.
- Metrics require both authentication and membership in the comma-separated
  `ADMIN_USER_IDS` environment variable. With no configured administrators, all
  users receive 403. This is an operational endpoint, not a public dashboard.
- A reused email does not merge identities. When the email is already assigned
  to another subject, the new subject retains its own account with a null email.
  Existing account ownership and data are unchanged.

## Session safety

- Cookies remain Secure and HttpOnly, with SameSite=Lax so OIDC callbacks work.
- The app no longer stores unused access tokens. Refresh tokens use AES-256-GCM,
  with a purpose-specific key derived from SESSION_SECRET and account-bound
  authenticated data. The key is not stored in the database.
- Refresh rotation is saved to the session store. A missing new ID token does
  not discard the existing identity.
- Legacy session rows are upgraded at server startup and when used. The startup
  upgrade uses compare-and-swap to preserve concurrent session renewal. Cookies,
  expiry, accounts, and inventory are unchanged; no sessions are deleted.
  Malformed legacy authentication payloads are removed without discarding other
  session data; only those invalid sessions need to sign in again. Maintenance
  failures are reported without sensitive details and no longer stop server boot.
- Logout uses a same-origin POST, destroys the local session, clears its cookie,
  and redirects only to a configured Replit domain.
- Sign-in does not force repeated consent or restart automatically after failure.

## HTTP protections

- Helmet provides security headers and a content security policy. Development
  permits Vite's inline preamble and WebSocket connection. Production does not
  permit inline scripts. Replit preview embedding is explicitly allowed.
- Unsafe browser requests from other origins/sites are rejected. GET OIDC
  callbacks remain allowed.
- JSON and form bodies are limited to 32 KiB. Invalid requests return generic
  errors without exposing exception details or throwing after a response.
- Per-instance rate limits: 300 API requests, 20 login requests, and 100 write
  requests per 15 minutes. Verified accounts have separate buckets; anonymous
  requests use the resolved client IP with IPv6 subnet grouping. Limiters run
  after Passport restores the session and before authentication/API handlers.
  These are not a distributed/global limiter across autoscaled instances.
- Proxy trust uses internal loopback, link-local, and private network ranges,
  not a fixed hop count or unrestricted trust. `TRUSTED_PROXY_CIDRS` can override
  this comma-separated list for a different hosting network. The proxy must
  sanitize forwarding headers and prevent untrusted access to trusted networks.
  Preview measurements confirmed that the old one-hop setting selected loopback
  and that the gateway removed supplied spoofed forwarding headers. Repeat a
  two-network remaining-budget check on production after publishing; the
  published proxy topology is not established by preview measurements alone.
- Unknown `/api` routes return JSON 404 responses before the SPA fallback.
  Permissions-Policy disables unused camera, microphone, and geolocation access.
- Public health checks return only healthy/unhealthy status, not memory,
  uptime, row counts, or internal errors.

## Input limits

- New inventory products must use the app's supported product names and units.
- Quantities and deductions must be finite, non-negative, and at most 1 billion.
- Inventory notes are limited to 2,000 characters.
- Lawn size must be a positive whole number, at most 1 million square metres.
- Weeks must be integers from 1 through 52, with at most 50 adjustments.

## Verification

Server regression tests cover HTTP protection, encrypted token storage and
renewal, POST logout, duplicate-email isolation, and two-user inventory/week
boundaries. The browser sign-in journey was attempted but blocked because the
test issuer did not activate; it redirected to the real Replit login provider.
No credentials were entered or production accounts tested. Public rendering and
live unauthenticated HTTP protections were verified separately.

## Inventory application consistency

Apply and undo use Neon HTTP batch transactions with an owning-user row lock.
Week reservation, stock deductions, and the application record commit together.
Duplicate applies return 409 with no additional deductions; duplicate undos
restore stock only once. A failed later adjustment rolls back earlier changes.
Undo adds back actual consumption, converting to the current stock unit, rather
than overwriting subsequent purchases or other weeks' deductions.

Database-backed regressions cover concurrent applies, concurrent undos,
different weeks, repeated products, unit changes, and rollback after a SQL error.
The current endpoint's batch error envelopes and decoded booleans are normalized
before the Neon driver parses them. Genuine errors are preserved, not treated as
empty successful results.

Rotating `SESSION_SECRET` invalidates signed cookies and encrypted refresh
tokens. Treat rotation as a planned reauthentication event, not a no-impact
configuration change.
