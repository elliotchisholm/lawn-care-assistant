import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeApplication } from "./startup";

const app = express();

// Track initialization status for deployment health
let isInitialized = false;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware to ensure initialization is complete before serving schedule data
app.use((req, res, next) => {
  // Block schedule endpoints until initialization completes
  if (req.path.startsWith('/api/schedule') && !isInitialized) {
    return res.status(503).json({ 
      message: 'Service initializing, please try again in a moment' 
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize the application asynchronously after server starts
    // This prevents blocking health checks during deployment
    initializeApplication()
      .then(() => {
        isInitialized = true;
        app.set('isInitialized', true);
        log('Application initialization complete');
      })
      .catch((error) => {
        console.error("Background initialization failed:", error);
        // Still mark as initialized to prevent permanent 503s
        // The app will return empty data but won't block forever
        isInitialized = true;
        app.set('isInitialized', true);
      });
  });
})();
