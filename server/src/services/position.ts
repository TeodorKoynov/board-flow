/**
 * Generates a position value between two existing positions.
 * Used for ordering cards within columns and columns within boards
 * without needing to reindex all items.
 */
export function generatePosition(
  before: string | null,
  after: string | null
): string {
  const b = before ? parseFloat(before) : 0;
  const a = after ? parseFloat(after) : b + 2;

  if (a <= b) {
    throw new Error('Invalid position: "after" must be greater than "before"');
  }

  const mid = Math.round(((b + a) / 2) * 10000) / 10000;
  return String(mid);
}

/**
 * Generates evenly spaced initial positions for a list of items.
 */
export function generateInitialPositions(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String((i + 1) * 1000));
}

/**
 * Sorts items by their position value.
 */
export function sortByPosition<T extends { position: string }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => parseFloat(a.position) - parseFloat(b.position)
  );
}
