# Observability Plan for Lawn Care Application

## Overview
This document outlines a phased approach to implementing observability for the lawn care application, with usage-based triggers that indicate when to move to the next phase.

---

## Phase 1: Foundation (Implement Now - Pre-Launch)
**Cost**: Free  
**Setup Time**: 2-4 hours

### What to Track

#### 1. Application Health
- Server startup/shutdown events
- Database connection status
- Weekly schedule seeding completion
- Health check endpoint (`/api/health`) response times

#### 2. Critical Error Logging
- Server-side errors (already logging to console)
- Failed authentication attempts
- Database query failures
- Inventory adjustment errors (especially insufficient inventory cases)

#### 3. Basic Metrics
- Total user signups
- Active sessions
- Database size
- API endpoint success/failure counts

### Recommended Tools
- **Console logging** (already in place) - enhance with structured JSON logs
- **Replit built-in logs** - review regularly for patterns
- **Simple metrics file** - track daily/weekly user counts in a local JSON file

### Implementation Triggers for Phase 2
- **10+ active users** using the app regularly
- **100+ mark-as-applied operations** completed
- **First bug report** from a real user that you can't reproduce
- **Database exceeds 100MB** in size

---

## Phase 2: User Insights (Growth Stage)
**Cost**: Free-$50/month  
**Setup Time**: 1-2 days

### What to Track

#### 1. User Behavior Analytics
- Feature adoption rates (who uses inventory vs. just views recommendations)
- Most viewed weeks (which parts of the 52-week schedule get the most attention)
- Average lawn size entered
- Product inventory patterns (which products are most commonly tracked)
- Mark-as-applied completion rate
- Undo operation frequency

#### 2. Performance Monitoring
- API endpoint response times (P50, P95, P99)
- Database query durations
- Frontend page load times
- React Query cache hit rates

#### 3. Error Tracking with Context
- User-specific error trails (what they did before the error)
- Browser/device information
- Session replay capabilities
- Stack traces with source maps

### Recommended Tools
- **Sentry** (free tier: 5k errors/month) - error tracking with context
- **PostHog** (free tier: 1M events/month) - product analytics & session replay
- **Replit Analytics** (if available) - built-in metrics

### Implementation Triggers for Phase 3
- **100+ daily active users**
- **1000+ API requests per day**
- **Multiple users reporting the same issue** (need better debugging)
- **Response times exceed 500ms** consistently
- **Monthly hosting costs exceed $50** (need cost optimization insights)

---

## Phase 3: Production-Grade (Scale Stage)
**Cost**: $100-300/month  
**Setup Time**: 1 week

### What to Track

#### 1. Advanced Performance Monitoring
- Real User Monitoring (RUM) - actual user experience metrics
- Database connection pool utilization
- Memory usage and leak detection
- React component render performance
- Bundle size tracking over time

#### 2. Business Intelligence
- User retention cohorts (week-over-week)
- Feature ROI analysis (which features drive engagement)
- Conversion funnels (sign-in → inventory setup → first application)
- Seasonal usage patterns (lawn care is seasonal!)
- Product recommendation accuracy (are users buying what you suggest?)

#### 3. Infrastructure Monitoring
- Database query performance and slow query detection
- API rate limiting and abuse detection
- Session store size and cleanup efficiency
- Automated alerting for anomalies

#### 4. Custom Dashboards
- Real-time active users
- Weekly application completion rate by week number
- Inventory levels across all users (aggregate insights)
- Most popular products by region (if you collect location)

### Recommended Tools
- **Datadog** or **New Relic** - full-stack observability
- **Mixpanel** or **Amplitude** - advanced product analytics
- **PagerDuty** - incident management and alerting
- **Grafana + Prometheus** - custom metric dashboards

### Implementation Triggers for Phase 4 (Enterprise)
- **1000+ daily active users**
- **$500+/month in hosting costs**
- **SLA requirements** from customers
- **Multi-region deployment** needed

---

## Quick Wins (Implement Today)

### 1. Enhance Existing Logging (15 minutes)
Add structured logging to your Express middleware:

```typescript
// Log all API calls with timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id
    }));
  });
  next();
});
```

### 2. Simple Usage Metrics (30 minutes)
Create a basic metrics endpoint:

```typescript
// GET /api/metrics (admin only)
{
  totalUsers: 0,
  totalInventoryItems: 0,
  totalApplicationsMarked: 0,
  totalUndoOperations: 0,
  averageLawnSize: 0
}
```

### 3. Health Check Enhancement (15 minutes)
Expand `/api/health` to include more details:

```typescript
{
  status: "healthy",
  uptime: process.uptime(),
  database: "connected",
  scheduleSeeded: true,
  memoryUsage: process.memoryUsage()
}
```

---

## Recommended Approach

**Start with Phase 1** (enhanced logging) now, even before launch. It costs nothing and gives you baseline visibility.

**Move to Phase 2** when you hit 10 active users OR encounter your first mystery bug. At that point, invest in Sentry (free tier) for error tracking and PostHog (free tier) for user analytics.

**Consider Phase 3** only when you're paying for hosting and have proven product-market fit with 100+ daily users.

---

## Key Metrics to Watch

### Health Indicators
- Server uptime percentage
- Database connection success rate
- API error rate (should be <1%)

### User Engagement
- Daily/Weekly active users
- Feature adoption rate
- Session duration
- Return user rate

### Performance
- API response time (target: <200ms)
- Database query time (target: <50ms)
- Page load time (target: <2s)

### Business Metrics
- New signups per week
- Mark-as-applied operations per user
- Inventory items tracked per user
- Average lawn size (product insights)

---

## Notes
- All cost estimates are approximate and based on typical pricing as of 2025
- Free tiers are usually sufficient for Phase 1 and early Phase 2
- Prioritize user privacy - anonymize data where possible
- Ensure compliance with data protection regulations if scaling internationally
