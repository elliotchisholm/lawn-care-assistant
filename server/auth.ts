import { createHash, timingSafeEqual } from "node:crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    authed?: boolean;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { claims: { sub: string } };
    }
  }
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

// In-memory failed-login tracking per IP. Single instance, single user.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

function isRateLimited(ip: string, now: number): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (now >= entry.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailure(ip: string, now: number): void {
  const entry = failedAttempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function passwordMatches(supplied: string, expected: string): boolean {
  // Hash both sides so the buffers are equal length for timingSafeEqual.
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function setupAuth(app: Express): void {
  const sessionSecret = requireEnv("SESSION_SECRET");
  const appPassword = requireEnv("APP_PASSWORD");
  const ownerId = requireEnv("OWNER_USER_ID");

  app.set("trust proxy", 1);

  const PgStore = connectPg(session);
  app.use(
    session({
      secret: sessionSecret,
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "sessions",
        createTableIfMissing: false,
        ttl: SESSION_TTL_MS / 1000,
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_TTL_MS,
      },
    }),
  );

  app.post("/api/login", async (req, res, next) => {
    try {
      const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
      const now = Date.now();

      if (isRateLimited(ip, now)) {
        return res.status(429).json({ message: "Too many failed attempts. Try again later." });
      }

      const password = req.body?.password;
      if (typeof password !== "string" || !passwordMatches(password, appPassword)) {
        recordFailure(ip, now);
        return res.status(401).json({ message: "Incorrect password" });
      }

      failedAttempts.delete(ip);

      const existing = await storage.getUser(ownerId);
      if (!existing) {
        await storage.upsertUser({ id: ownerId });
      }
      await storage.initializeUserInventory(ownerId);

      req.session.regenerate((regenError) => {
        if (regenError) return next(regenError);
        req.session.authed = true;
        req.session.save((saveError) => {
          if (saveError) return next(saveError);
          res.json({ ok: true });
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      res.json({ ok: true });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.session?.authed) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // Keep the shape existing routes read (req.user.claims.sub).
  req.user = { claims: { sub: process.env.OWNER_USER_ID as string } };
  next();
};
