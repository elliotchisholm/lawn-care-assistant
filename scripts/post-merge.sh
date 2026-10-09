#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "Installing locked dependencies..."
npm ci --include=dev --no-audit --no-fund

echo "Checking types..."
npm run check

echo "Checking dependency security and SSO regressions..."
npm exec -- vitest run server/__tests__/dependency-security.test.ts server/__tests__/sso.test.ts server/__tests__/session-tokens.test.ts server/__tests__/security-middleware.test.ts server/__tests__/legacy-sessions.test.ts server/__tests__/neon-transport.test.ts

echo "Building the application..."
npm run build

echo "Post-merge setup complete."
