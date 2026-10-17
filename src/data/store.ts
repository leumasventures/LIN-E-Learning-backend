/**
 * Legacy in-memory store — no longer used for persistence.
 * All modules now use MySQL via src/data/*.ts
 * Kept only so accidental imports fail loudly in review rather than silently.
 */
export function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
