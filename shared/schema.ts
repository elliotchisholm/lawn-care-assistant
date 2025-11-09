import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  lawnSize: integer("lawn_size").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Inventory management for tracking product stocks
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productName: text("product_name").notNull(),
  currentQuantity: decimal("current_quantity").notNull(),
  unit: text("unit").notNull(), // ml, g, L, kg
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  purchaseDate: timestamp("purchase_date"),
  notes: text("notes")
}, (table) => [
  unique().on(table.userId, table.productName)
]);

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true
});

export const updateInventorySchema = insertInventorySchema.partial().omit({
  userId: true
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type UpdateInventory = z.infer<typeof updateInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Weekly schedule for application guide
export const weeklySchedule = pgTable("weekly_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekNumber: integer("week_number").notNull().unique(),
  month: text("month").notNull(),
  weekOfMonth: integer("week_of_month").notNull(),
  isRestWeek: integer("is_rest_week").default(0).notNull(), // 0 = false, 1 = true (SQLite compatibility)
  applicationDays: jsonb("application_days").notNull().default('[]'), // Array of day objects with products
  generalNotes: text("general_notes")
});

export const insertWeeklyScheduleSchema = createInsertSchema(weeklySchedule).omit({
  id: true
});

export type InsertWeeklySchedule = z.infer<typeof insertWeeklyScheduleSchema>;
export type WeeklySchedule = typeof weeklySchedule.$inferSelect;

// TypeScript types for application day structure
export interface ApplicationProduct {
  name: string;
  alternativeName: string | null;
  quantity: number;
  unit: string;
  type: 'liquid' | 'granular' | 'insecticide';
  productNotes: string | null;
}

export interface ApplicationDay {
  dayLabel: string | null;
  products: ApplicationProduct[];
  dayNotes: string | null;
}

// Applied weeks tracking - records when a user marks a week as applied
export const appliedWeeks = pgTable("applied_weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  adjustments: jsonb("adjustments").notNull(), // Array of {productName, amountDeducted, unit, previousQuantity, newQuantity}
}, (table) => [
  unique().on(table.userId, table.weekNumber)
]);

export const insertAppliedWeekSchema = createInsertSchema(appliedWeeks).omit({
  id: true,
  appliedAt: true
});

export type InsertAppliedWeek = z.infer<typeof insertAppliedWeekSchema>;
export type AppliedWeek = typeof appliedWeeks.$inferSelect;

// TypeScript type for adjustment records
export interface InventoryAdjustment {
  productName: string;
  amountDeducted: number;
  unit: string;
  previousQuantity: number;
  newQuantity: number;
}

// System metrics table for tracking operational counters (Phase 1 observability)
export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricKey: text("metric_key").notNull().unique(),
  metricValue: integer("metric_value").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export type SystemMetric = typeof systemMetrics.$inferSelect;
