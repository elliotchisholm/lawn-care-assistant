import { randomUUID } from "node:crypto";
import { sql, type SQL } from "drizzle-orm";
import type { AppliedWeek, InventoryAdjustment } from "@shared/schema";
import { db } from "./db";

export class WeekAlreadyAppliedError extends Error {
  constructor() { super("Week already applied. Use undo first if you want to reapply."); }
}

function convert(amount: SQL, from: SQL, to: SQL): SQL {
  return sql`CASE
    WHEN lower(${from}) = lower(${to}) THEN ${amount}
    WHEN (lower(${from}) = 'g' AND lower(${to}) = 'kg')
      OR (lower(${from}) = 'ml' AND lower(${to}) = 'l') THEN ${amount} / 1000
    WHEN (lower(${from}) = 'kg' AND lower(${to}) = 'g')
      OR (lower(${from}) = 'l' AND lower(${to}) = 'ml') THEN ${amount} * 1000
    ELSE ${amount} END`;
}

function cell(result: { rows: any[] }, name: string) {
  const row = result.rows?.[0];
  return Array.isArray(row) ? row[0] : row?.[name];
}

/** HTTP Neon supports batch transactions, not interactive db.transaction callbacks.
 * Lock the owning user in the first statement; subsequent READ COMMITTED statements
 * see the result of any application/undo that finished while this lock was waiting.
 */
export async function applyWeek(userId: string, weekNumber: number, adjustments: InventoryAdjustment[]): Promise<AppliedWeek> {
  const queries = [
    db.execute(sql`WITH owner AS (SELECT id FROM users WHERE id = ${userId} FOR UPDATE)
      SELECT count(*) FROM owner`),
    db.execute(sql`WITH reserved AS (
      INSERT INTO applied_weeks (id, user_id, week_number, adjustments)
      VALUES (${randomUUID()}, ${userId}, ${weekNumber}, '[]'::jsonb) RETURNING id
    ) SELECT count(*) FROM reserved`),
  ];
  for (const adjustment of adjustments) {
    const { productName, amountDeducted, unit } = adjustment;
    queries.push(db.execute(sql`WITH ensured AS (
      INSERT INTO inventory (id, user_id, product_name, current_quantity, unit)
      VALUES (${randomUUID()}, ${userId}, ${productName}, 0, ${unit})
      ON CONFLICT (user_id, product_name) DO NOTHING RETURNING id
    ) SELECT count(*) FROM ensured`));
    const deducted = convert(sql`${amountDeducted}::numeric`, sql`${unit}::text`, sql`p.unit`);
    queries.push(db.execute(sql`
      WITH previous AS MATERIALIZED (
        SELECT id, current_quantity AS quantity, unit FROM inventory
        WHERE user_id = ${userId} AND product_name = ${productName} FOR UPDATE
      ), amounts AS (
        SELECT p.*, ${deducted} AS deduction FROM previous p
      ), changed AS (
        UPDATE inventory i SET current_quantity = greatest(0, a.quantity - a.deduction),
          last_updated = now()
        FROM amounts a WHERE i.id = a.id AND i.user_id = ${userId}
        RETURNING i.id, i.current_quantity
      ), logged AS (
      UPDATE applied_weeks SET adjustments = adjustments || (
        SELECT jsonb_build_array(jsonb_build_object(
          'productName', ${productName}::text, 'amountDeducted', a.deduction,
          'unit', a.unit, 'previousQuantity', a.quantity, 'newQuantity', c.current_quantity))
        FROM changed c JOIN amounts a ON a.id = c.id
      ) WHERE user_id = ${userId} AND week_number = ${weekNumber} RETURNING id
      ) SELECT count(*) FROM logged
    `));
  }
  queries.push(db.execute(sql`SELECT jsonb_build_object(
    'id', id, 'userId', user_id, 'weekNumber', week_number,
    'appliedAt', applied_at, 'adjustments', adjustments) AS application
    FROM applied_weeks WHERE user_id = ${userId} AND week_number = ${weekNumber}`));
  try {
    // A duplicate reservation fails the transaction, rolling back ALL deductions.
    const results = await db.batch(queries as [typeof queries[number], ...typeof queries[number][]]);
    const application = cell(results[results.length - 1], "application");
    if (!application) throw new Error("Unable to load committed application");
    return { ...application, appliedAt: new Date(application.appliedAt) };
  } catch (error) {
    let cause: any = error;
    while (cause?.cause) cause = cause.cause;
    if (cause?.code === "23505"
      && /^applied_weeks_.*user_id.*week_number/.test(cause.constraint ?? "")) {
      throw new WeekAlreadyAppliedError();
    }
    if (cause?.message === "commit unexpectedly resulted in rollback") {
      // This endpoint sometimes drops the original SQLSTATE after a rollback.
      // Only classify it as a duplicate when the owning user's week really exists.
      const result = await db.execute(sql`SELECT count(*) AS existing FROM applied_weeks
        WHERE user_id = ${userId} AND week_number = ${weekNumber}`);
      if (Number(cell(result, "existing")) > 0) throw new WeekAlreadyAppliedError();
    }
    throw error;
  }
}

export async function undoWeek(userId: string, weekNumber: number): Promise<boolean> {
  // Restore the actual quantity consumed, not the historical stock balance.
  // This preserves subsequent purchases and deductions from other weeks.
  const consumed = sql`greatest(0, (e->>'previousQuantity')::numeric - (e->>'newQuantity')::numeric)`;
  const restored = convert(consumed, sql`e->>'unit'`, sql`i.unit`);
  const results = await db.batch([
    db.execute(sql`WITH owner AS (SELECT id FROM users WHERE id = ${userId} FOR UPDATE)
      SELECT count(*) FROM owner`),
    db.execute(sql`WITH restored AS (UPDATE inventory i SET current_quantity = i.current_quantity + (
      SELECT coalesce(sum(${restored}), 0)
      FROM applied_weeks a CROSS JOIN LATERAL jsonb_array_elements(a.adjustments) e
      WHERE a.user_id = ${userId} AND a.week_number = ${weekNumber}
        AND e->>'productName' = i.product_name
    ), last_updated = now()
    WHERE i.user_id = ${userId} AND EXISTS (
      SELECT 1 FROM applied_weeks a CROSS JOIN LATERAL jsonb_array_elements(a.adjustments) e
      WHERE a.user_id = ${userId} AND a.week_number = ${weekNumber}
        AND e->>'productName' = i.product_name
    ) RETURNING i.id) SELECT count(*) FROM restored`),
    db.execute(sql`WITH metric AS (INSERT INTO system_metrics (id, metric_key, metric_value)
      SELECT ${randomUUID()}, 'total_undo_operations', 1
      WHERE EXISTS (SELECT 1 FROM applied_weeks WHERE user_id = ${userId} AND week_number = ${weekNumber})
      ON CONFLICT (metric_key) DO UPDATE SET metric_value = system_metrics.metric_value + 1, updated_at = now()
      RETURNING id) SELECT count(*) FROM metric`),
    db.execute(sql`WITH removed AS (
      DELETE FROM applied_weeks WHERE user_id = ${userId} AND week_number = ${weekNumber} RETURNING id
    ) SELECT EXISTS (SELECT 1 FROM removed) AS undone`),
  ]);
  return cell(results[3], "undone") === true;
}
