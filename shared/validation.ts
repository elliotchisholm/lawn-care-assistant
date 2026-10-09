import { z } from "zod";
import { CANONICAL_PRODUCT_NAMES } from "./canonicalProductNames";

export const MAX_LAWN_SIZE = 1_000_000;
export const MAX_QUANTITY = 1_000_000_000;
export const MAX_NOTES_LENGTH = 2000;

export const productNameSchema = z.enum(CANONICAL_PRODUCT_NAMES);
export const unitSchema = z.enum(["ml", "g", "L", "kg"]);
export const quantitySchema = z.string().trim().min(1).max(32)
  .regex(/^\d+(?:\.\d+)?$/, "Quantity must be a non-negative decimal")
  .refine(value => Number.isFinite(Number(value)) && Number(value) <= MAX_QUANTITY, "Quantity is too large");
export const lawnSizeSchema = z.number().finite().int().positive().max(MAX_LAWN_SIZE);
const adjustmentQuantity = z.number().finite().nonnegative().max(MAX_QUANTITY);
export const adjustmentsSchema = z.array(z.object({
  productName: productNameSchema,
  amountDeducted: adjustmentQuantity,
  unit: unitSchema,
  previousQuantity: adjustmentQuantity,
  newQuantity: adjustmentQuantity,
})).max(50);
