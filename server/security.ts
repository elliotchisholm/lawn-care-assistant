import type { Express, RequestHandler, ErrorRequestHandler } from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

export const requireAdmin: RequestHandler = (req, res, next) => {
  const subject = (req.user as any)?.claims?.sub;
  const admins = (process.env.ADMIN_USER_IDS ?? "").split(",").map(id => id.trim()).filter(Boolean);
  if (!subject || !admins.includes(subject)) {
    return res.status(403).json({ error: "Administrator access required" });
  }
  next();
};

export const requireSameOrigin: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("Origin");
  const domains = (process.env.REPLIT_DOMAINS ?? "").split(",").map(domain => domain.trim()).filter(Boolean);
  if (process.env.REPLIT_DEV_DOMAIN) domains.push(process.env.REPLIT_DEV_DOMAIN);
  const allowed = new Set(domains.map(domain => `https://${domain}`));
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:5000");
    allowed.add("http://127.0.0.1:5000");
  }
  if (req.get("Sec-Fetch-Site") === "cross-site" || (origin && !allowed.has(origin))) {
    return res.status(403).json({ error: "Cross-site request blocked" });
  }
  next();
};

export const handleRequestError: ErrorRequestHandler = (error, _req, res, _next) => {
  const requestedStatus = error.status || error.statusCode || 500;
  const status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus : 500;
  const message = status === 413 ? "Request too large"
    : status < 500 ? "Invalid request" : "Internal server error";
  console.error(`Request failed (${status}).`);
  if (!res.headersSent) res.status(status).json({ message });
};

export function applySecurity(app: Express, limits = { api: 300, login: 20, writes: 100 }) {
  app.set("trust proxy", 1);
  const development = app.get("env") === "development";
  app.use(helmet({
    frameguard: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "https://replit.com", ...(development ? ["'unsafe-inline'"] : [])],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...(development ? ["ws:", "wss:"] : [])],
        frameAncestors: ["'self'", "https://replit.com", "https://*.replit.com"],
        upgradeInsecureRequests: development ? null : [],
      },
    },
  }));
  const limiter = (limit: number) => rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  });
  app.use("/api", requireSameOrigin, limiter(limits.api));
  app.use("/api/login", limiter(limits.login));
  const writeLimiter = limiter(limits.writes);
  app.use("/api", (req, res, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return writeLimiter(req, res, next);
    }
    next();
  });
}
