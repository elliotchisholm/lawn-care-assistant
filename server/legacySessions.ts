import { and, count, eq, sql } from "drizzle-orm";
import { sessions } from "@shared/schema";
import { db } from "./db";
import { storedSessionUser } from "./sessionTokens";

/** Encrypt legacy tokens without changing cookies, expiry, identity, or user data. */
export async function upgradeLegacySessions(onlySessionId?: string): Promise<number> {
  const legacy = sql`
    jsonb_typeof(${sessions.sess}->'passport'->'user') = 'object'
    AND ((${sessions.sess}->'passport'->'user') ? 'access_token'
      OR (${sessions.sess}->'passport'->'user') ? 'refresh_token')`;
  const filter = onlySessionId ? and(legacy, eq(sessions.sid, onlySessionId)) : legacy;
  let examined = 0;
  while (true) {
    // The endpoint's empty-row compatibility issue does not affect COUNT.
    const [result] = await db.select({ remaining: count() }).from(sessions).where(filter);
    if (!result) throw new Error("Unable to check legacy sessions");
    if (result.remaining === 0) return examined;
    const batch = await db.select().from(sessions).where(filter).limit(100).catch(error => {
      // Another instance may finish the same batch between COUNT and SELECT.
      if (error?.cause instanceof TypeError
        && error.cause.message === "Cannot read properties of null (reading 'map')") return [];
      throw error;
    });
    if (!batch.length) continue;
    for (const row of batch) {
      const original = row.sess as Record<string, any>;
      const upgraded = {
        ...original,
        passport: { ...original.passport, user: storedSessionUser(original.passport.user) },
      };
      // Compare-and-swap avoids overwriting a session concurrently renewed by another instance.
      await db.update(sessions).set({ sess: upgraded }).where(and(
        eq(sessions.sid, row.sid),
        sql`${sessions.sess} = ${JSON.stringify(original)}::jsonb`,
      ));
      examined++;
    }
  }
}
