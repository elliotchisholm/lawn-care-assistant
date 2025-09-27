import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInventorySchema, updateInventorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Inventory management routes
  
  // Get all inventory items for a user
  app.get("/api/inventory/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const items = await storage.getUserInventory(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  // Create new inventory item
  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
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

  // Update inventory item
  app.put("/api/inventory/:id/:userId", async (req, res) => {
    try {
      const { id, userId } = req.params;
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

  // Delete inventory item
  app.delete("/api/inventory/:id/:userId", async (req, res) => {
    try {
      const { id, userId } = req.params;
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

  // Get specific inventory item by product name
  app.get("/api/inventory/:userId/:productName", async (req, res) => {
    try {
      const { userId, productName } = req.params;
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
