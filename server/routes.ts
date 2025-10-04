import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventorySchema, updateInventorySchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  const httpServer = createServer(app);

  return httpServer;
}
