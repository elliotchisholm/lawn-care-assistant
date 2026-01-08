#!/bin/bash
set -e

echo "========================================"
echo "  NZLA Lawn Care - Full Test Suite"
echo "========================================"
echo ""

FAILED=0

echo "[1/2] Running Backend Tests..."
echo "----------------------------------------"
if npx vitest run; then
  echo "Backend tests: PASSED"
else
  echo "Backend tests: FAILED"
  FAILED=1
fi

echo ""
echo "[2/2] Running Frontend Tests..."
echo "----------------------------------------"
if npx vitest run --config vitest.client.config.ts; then
  echo "Frontend tests: PASSED"
else
  echo "Frontend tests: FAILED"
  FAILED=1
fi

echo ""
echo "========================================"
if [ $FAILED -eq 0 ]; then
  echo "  ALL TESTS PASSED"
  echo "========================================"
  exit 0
else
  echo "  SOME TESTS FAILED"
  echo "========================================"
  exit 1
fi
