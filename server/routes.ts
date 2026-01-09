import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventorySchema, updateInventorySchema, insertAppliedWeekSchema, type InventoryAdjustment } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { parsePackageSizes } from "./parsePackageSizes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Enhanced health check endpoint (Phase 1 observability)
  app.get('/api/health', async (_req, res) => {
    try {
      const scheduleCount = await storage.getScheduleCount();
      const isInitialized = (app.get('isInitialized') as boolean) || false;
      
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        initialized: isInitialized,
        database: {
          connected: true,
          scheduleWeeksLoaded: scheduleCount
        },
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          unit: 'MB'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        initialized: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Basic metrics endpoint (Phase 1 observability) - admin only
  app.get('/api/metrics', isAuthenticated, async (_req, res) => {
    try {
      const [totalUsers, totalInventoryItems, totalApplicationsMarked, totalUndoOperations, averageLawnSize] = await Promise.all([
        storage.getTotalUsers(),
        storage.getTotalInventoryItems(),
        storage.getTotalApplicationsMarked(),
        storage.getTotalUndoOperations(),
        storage.getAverageLawnSize()
      ]);
      
      res.json({
        totalUsers,
        totalInventoryItems,
        totalApplicationsMarked,
        totalUndoOperations,
        averageLawnSize,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ 
        error: "Failed to fetch metrics",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user lawn size
  app.put('/api/user/lawn-size', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lawnSizeSchema = z.object({
        lawnSize: z.number().positive().int()
      });
      const { lawnSize } = lawnSizeSchema.parse(req.body);
      const updatedUser = await storage.updateUserLawnSize(userId, lawnSize);
      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating lawn size:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update lawn size" });
      }
    }
  });

  // Protected inventory management routes
  
  // Get all inventory items for authenticated user
  app.get("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getUserInventory(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Create new inventory item for authenticated user
  app.post("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertInventorySchema.parse({ ...req.body, userId });
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create inventory item" });
      }
    }
  });

  // Update inventory item for authenticated user
  app.put("/api/inventory/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const validatedData = updateInventorySchema.parse(req.body);
      const updatedItem = await storage.updateInventoryItem(id, userId, validatedData);
      if (!updatedItem) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update inventory item" });
      }
    }
  });

  // Delete inventory item for authenticated user
  app.delete("/api/inventory/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteInventoryItem(id, userId);
      if (!deleted) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ error: "Failed to delete inventory item" });
    }
  });

  // Get specific inventory item by product name for authenticated user
  app.get("/api/inventory/product/:productName", isAuthenticated, async (req: any, res) => {
    try {
      const { productName } = req.params;
      const userId = req.user.claims.sub;
      const item = await storage.getInventoryItem(userId, decodeURIComponent(productName));
      if (!item) {
        res.status(404).json({ error: "Inventory item not found" });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching inventory item:", error);
      res.status(500).json({ error: "Failed to fetch inventory item" });
    }
  });

  // Applied weeks routes - tracking weekly applications
  
  // Check if a specific week is applied for authenticated user
  app.get("/api/applied-weeks/:weekNumber", isAuthenticated, async (req: any, res) => {
    try {
      const weekNumber = parseInt(req.params.weekNumber);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
        res.status(400).json({ error: "Invalid week number" });
        return;
      }
      const userId = req.user.claims.sub;
      const appliedWeek = await storage.getAppliedWeek(userId, weekNumber);
      res.json(appliedWeek || null);
    } catch (error) {
      console.error("Error checking applied week:", error);
      res.status(500).json({ error: "Failed to check applied week" });
    }
  });

  // Mark a week as applied with inventory deductions
  app.post("/api/applied-weeks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertAppliedWeekSchema.parse({ ...req.body, userId });
      
      // Check if week is already applied - reject duplicates
      const existingApplication = await storage.getAppliedWeek(userId, validatedData.weekNumber);
      if (existingApplication) {
        res.status(409).json({ error: "Week already applied. Use undo first if you want to reapply." });
        return;
      }
      
      // Validate adjustments structure
      const adjustmentsSchema = z.array(z.object({
        productName: z.string(),
        amountDeducted: z.number(),
        unit: z.string(),
        previousQuantity: z.number(),
        newQuantity: z.number()
      }));
      
      const adjustments = adjustmentsSchema.parse(validatedData.adjustments);
      
      // Apply inventory deductions and create applied week record
      const appliedWeek = await storage.markWeekAsApplied(
        userId,
        validatedData.weekNumber,
        adjustments as InventoryAdjustment[]
      );
      
      res.status(201).json(appliedWeek);
    } catch (error) {
      console.error("Error marking week as applied:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to mark week as applied" });
      }
    }
  });

  // Undo a week application (restore inventory)
  app.delete("/api/applied-weeks/:weekNumber", isAuthenticated, async (req: any, res) => {
    try {
      const weekNumber = parseInt(req.params.weekNumber);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
        res.status(400).json({ error: "Invalid week number" });
        return;
      }
      const userId = req.user.claims.sub;
      const deleted = await storage.undoWeekApplication(userId, weekNumber);
      if (!deleted) {
        res.status(404).json({ error: "Applied week not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error undoing week application:", error);
      res.status(500).json({ error: "Failed to undo week application" });
    }
  });

  // Weekly schedule routes (public - no auth required)
  
  // Get all weekly schedule data
  app.get("/api/schedule", async (_req, res) => {
    try {
      const schedule = await storage.getAllWeeklySchedule();
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching weekly schedule:", error);
      res.status(500).json({ error: "Failed to fetch weekly schedule" });
    }
  });

  // Get specific week schedule
  app.get("/api/schedule/:weekNumber", async (req, res) => {
    try {
      const weekNumber = parseInt(req.params.weekNumber);
      if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
        res.status(400).json({ error: "Invalid week number" });
        return;
      }
      const week = await storage.getWeeklyScheduleByWeek(weekNumber);
      if (!week) {
        res.status(404).json({ error: "Week not found" });
        return;
      }
      res.json(week);
    } catch (error) {
      console.error("Error fetching week schedule:", error);
      res.status(500).json({ error: "Failed to fetch week schedule" });
    }
  });

  // Package sizes endpoint (public - no auth required)
  app.get("/api/package-sizes", async (_req, res) => {
    try {
      const packageMap = parsePackageSizes();
      // Convert Map to object for JSON serialization
      const packageData: Record<string, any[]> = {};
      packageMap.forEach((packages, productName) => {
        packageData[productName] = packages;
      });
      res.json(packageData);
    } catch (error) {
      console.error("Error fetching package sizes:", error);
      res.status(500).json({ error: "Failed to fetch package sizes" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
