import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler, ErrorRequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { encryptRefreshToken, decryptRefreshToken, storedSessionUser } from "./sessionTokens";
import { upgradeLegacySessions } from "./legacySessions";

declare module "express-session" {
  interface SessionData {
    passport?: { user: Express.User };
  }
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl / 1000,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  const claims = tokens.claims();
  if (claims) {
    if (user.claims?.sub && user.claims.sub !== claims.sub) throw new Error("Refresh identity mismatch");
    user.claims = claims;
  }
  if (!user.claims?.sub) throw new Error("Missing sign-in identity");
  // Access tokens are not used by this app. Only retain an encrypted refresh token.
  delete user.access_token;
  delete user.refresh_token;
  if (tokens.refresh_token) {
    user.encrypted_refresh_token = encryptRefreshToken(tokens.refresh_token, user.claims.sub);
  }
  user.expires_at = claims?.exp
    ?? (tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : user.expires_at);
}

async function upsertUser(
  claims: any,
) {
  const user = await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
  
  await storage.initializeUserInventory(user.id);
}

export async function setupAuth(app: Express) {
  await upgradeLegacySessions();
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    } catch (error) {
      verified(error instanceof Error ? error : new Error("Sign-in verification failed"));
    }
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => {
    try { cb(null, storedSessionUser(user)); } catch (error) { cb(error); }
  });
  passport.deserializeUser((user: Express.User, cb) => {
    try { cb(null, storedSessionUser(user)); } catch (error) { cb(error); }
  });
  app.use((req, _res, next) => {
    // Upgrade legacy sessions as they are used, without signing users out.
    const stored = req.session?.passport?.user as any;
    if (stored && ("access_token" in stored || "refresh_token" in stored) && req.user) {
      req.session.passport!.user = req.user;
    }
    next();
  });

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      // Let the provider reuse its session and previously granted consent.
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  const handleCallbackError: ErrorRequestHandler = (_error, _req, res, _next) => {
    // Do not expose provider errors, authorization codes, or tokens to the browser.
    console.error("Sign-in callback failed; authentication did not complete.");
    res.redirect("/?auth_error=sign_in_failed");
  };

  const handleCallback: RequestHandler = (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      // Never automatically restart OAuth after denial or failed verification.
      failureRedirect: "/?auth_error=sign_in_failed",
    })(req, res, next);
  };
  app.get("/api/callback", handleCallback, handleCallbackError);

  app.get("/api/logout", (_req, res) => {
    res.set("Allow", "POST").status(405).json({ error: "Use POST to sign out" });
  });
  app.post("/api/logout", (req, res, next) => {
    const domains = process.env.REPLIT_DOMAINS!.split(",").map(domain => domain.trim()).filter(Boolean);
    const domain = domains.includes(req.hostname) ? req.hostname : domains[0];
    const logoutUrl = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: `https://${domain}`,
    }).href;
    req.logout(error => {
      if (error) return next(error);
      req.session.destroy(error => {
        if (error) return next(error);
        res.clearCookie("connect.sid", { path: "/", httpOnly: true, secure: true, sameSite: "lax" });
        res.redirect(303, logoutUrl);
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  if (!user.encrypted_refresh_token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const refreshToken = decryptRefreshToken(user.encrypted_refresh_token, user.claims.sub);
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    req.session.passport!.user = storedSessionUser(user);
    return req.session.save(error => {
      if (error) return next(error);
      next();
    });
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};