/**
 * Legacy in-memory store — removed.
 * All persistence is MySQL via src/data/*.ts and sql/schema.sql.
 * nextId kept only for rare ID generation if needed outside crypto.randomUUID.
 */
export function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
