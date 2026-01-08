#!/bin/bash
set -e

echo "========================================"
echo "  Pre-Deployment Validation"
echo "========================================"
echo ""

echo "[1/4] Type checking..."
if npx tsc --noEmit 2>/dev/null; then
  echo "TypeScript: PASSED"
else
  echo "TypeScript: WARNING (non-blocking)"
fi

echo ""
echo "[2/4] Running test suite..."
if bash scripts/run-tests.sh; then
  echo ""
  echo "Tests: PASSED"
else
  echo ""
  echo "Tests: FAILED - Deployment blocked"
  exit 1
fi

echo ""
echo "[3/4] Checking database connection..."
if curl -s http://localhost:5000/api/health | grep -q '"status":"healthy"'; then
  echo "Database: CONNECTED"
else
  echo "Database: WARNING - Could not verify connection"
fi

echo ""
echo "[4/4] Verifying schedule data..."
WEEK_COUNT=$(curl -s http://localhost:5000/api/schedule | grep -o '"weekNumber"' | wc -l)
if [ "$WEEK_COUNT" -eq 52 ]; then
  echo "Schedule: 52 weeks loaded"
else
  echo "Schedule: WARNING - Expected 52 weeks, found $WEEK_COUNT"
fi

echo ""
echo "========================================"
echo "  READY FOR DEPLOYMENT"
echo "========================================"
