# Troubleshooting Guide - Lawn Care Application

## Error: "Failed to load weekly application schedule"

This guide helps diagnose and resolve issues when the weekly schedule fails to load in the deployed application.

---

## Quick Diagnostic Steps

### Step 1: Check Application Health

**Access the health endpoint:**
```bash
curl https://your-deployed-app.replit.app/api/health
```

**Expected healthy response:**
```json
{
  "status": "ok",
  "initialized": true,
  "database": {
    "connected": true,
    "scheduleWeeksLoaded": 51
  },
  "timestamp": "2025-10-12T00:14:14.967Z"
}
```

**What to check:**
- ✅ `initialized: true` - Server has completed startup
- ✅ `connected: true` - Database is accessible
- ✅ `scheduleWeeksLoaded: 51` - All weeks are seeded

### Step 2: Test Schedule API Directly

**Test specific week:**
```bash
curl https://your-deployed-app.replit.app/api/schedule/41
```

**Expected response:**
```json
{
  "id": "...",
  "weekNumber": 41,
  "applicationDays": [...],
  "isRestWeek": 0
}
```

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - Network errors (503, 500, 404)
   - Failed fetch requests
   - CORS errors

### Step 4: Check Server Logs

Look for these key messages in server logs:
```
✅ [express] serving on port 5000
✅ Seeding weekly schedule from NZLA application guide...
✅ Successfully seeded 51 weeks of NZLA application schedule
✅ Application initialization complete
```

---

## Common Issues and Solutions

### Issue 1: Service Initializing (503 Error)

**Symptom:** Error appears immediately after deployment, then disappears

**Cause:** Server is still seeding the database (first 5-10 seconds after deployment)

**Solution:** 
- ✅ Wait 10 seconds and refresh the page
- ✅ This is normal behavior during deployment
- ✅ Health endpoint will show `initialized: false` during this period

**Prevention:** Already implemented - initialization runs in background after server starts

---

### Issue 2: Database Connection Failed

**Symptom:** Health endpoint returns error or 503 status

**Example error response:**
```json
{
  "status": "error",
  "initialized": false,
  "error": "Database connection failed",
  "timestamp": "..."
}
```

**Solutions:**
1. Check DATABASE_URL environment variable is set
2. Verify Neon database is accessible
3. Check database connection logs in server output
4. Restart the deployment

---

### Issue 3: Schedule Data Not Seeded

**Symptom:** 
- Health endpoint shows `scheduleWeeksLoaded: 0`
- API returns 404 for all weeks

**Solutions:**
1. Check server logs for seeding errors
2. Verify `server/scheduleData.ts` file exists
3. Force re-seed by restarting the server
4. Check database permissions

**Manual verification:**
```bash
# Check if data exists
curl https://your-app.replit.app/api/schedule | grep weekNumber
```

---

### Issue 4: Persistent Errors After Initialization

**Symptom:** 
- Health shows `initialized: true`
- Schedule API still returns errors

**Diagnostic steps:**
1. Check specific week API:
   ```bash
   curl https://your-app.replit.app/api/schedule/1
   ```

2. Check database query logs in server output

3. Verify database schema matches application:
   ```bash
   npm run db:push
   ```

**Solutions:**
- Re-deploy the application
- Check for schema migration issues
- Verify all 52 weeks are in database

---

### Issue 5: Network/CORS Errors

**Symptom:** Browser console shows network errors or CORS issues

**Solutions:**
1. Verify frontend and backend are on same port (5000)
2. Check Vite proxy configuration
3. Ensure API routes start with `/api/`
4. Verify Replit deployment settings

---

## Deployment-Specific Troubleshooting

### Health Check Failures During Deployment

**What happens:**
1. t=0s: Server starts on port 5000 (health checks pass ✅)
2. t=0-6s: Database seeding in background
3. t=0-6s: Schedule requests return 503 (service initializing)
4. t=6s: Initialization complete
5. t=6s+: All requests work normally ✅

**This is normal behavior.** The deployment will succeed and the app will work after initialization.

### If Deployment Still Fails

1. **Check server startup time:**
   - Should respond to health checks within 2-3 seconds
   - Seeding happens in background

2. **Verify health check endpoint:**
   ```bash
   curl https://your-app.replit.app/api/health
   ```

3. **Check deployment logs** for initialization errors

---

## Advanced Diagnostics

### Enable Debug Mode (Development Only)

In development, the error card will show additional debug information:
- Click "Debug Info" to expand error details
- Shows full error object from React Query
- Includes network status codes and messages

### Monitor Initialization Status

Watch initialization in real-time:
```bash
# Monitor health endpoint
watch -n 1 'curl -s https://your-app.replit.app/api/health'
```

### Check Database Directly

If you have database access:
```sql
-- Count schedule weeks
SELECT COUNT(*) FROM weekly_schedule;

-- Verify week 41 exists (test case)
SELECT * FROM weekly_schedule WHERE week_number = 41;
```

---

## Error Response Reference

### 503 Service Unavailable
```json
{
  "message": "Service initializing, please try again in a moment"
}
```
**Action:** Wait 10 seconds and retry

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch weekly schedule"
}
```
**Action:** Check server logs for database errors

### 404 Not Found
```json
{
  "error": "Week not found"
}
```
**Action:** Verify week number (1-52) and check database seeding

---

## Prevention Checklist

Before deploying, verify:
- [ ] Database connection configured (DATABASE_URL)
- [ ] Schedule data file exists (`server/scheduleData.ts`)
- [ ] Initialization middleware enabled in `server/index.ts`
- [ ] Health endpoint accessible at `/api/health`
- [ ] Server starts within 5 seconds (health checks)
- [ ] Background seeding completes within 10 seconds

---

## Getting Help

If issues persist:

1. **Check health endpoint output:**
   ```bash
   curl https://your-app.replit.app/api/health
   ```

2. **Provide these details:**
   - Health endpoint response
   - Specific error message from browser
   - Server log excerpt (startup + initialization)
   - Week number that's failing
   - Browser console errors

3. **Test specific week API:**
   ```bash
   curl https://your-app.replit.app/api/schedule/41
   ```

---

## Summary

Most "Failed to load weekly application schedule" errors are due to:
1. ⏱️ **Temporary** - Initialization still running (wait 10 seconds)
2. 🔌 **Database** - Connection or seeding issues (check health endpoint)
3. 🌐 **Network** - CORS or routing problems (check browser console)

The health endpoint (`/api/health`) is your primary diagnostic tool - use it first!
