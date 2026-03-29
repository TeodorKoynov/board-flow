/**
 * Generates a position value between two existing positions.
 * Mirrors the server-side implementation for optimistic updates.
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

export function sortByPosition<T extends { position: string }>(
  items: T[]
): T[] {
  return [...items].sort(
    (a, b) => parseFloat(a.position) - parseFloat(b.position)
  );
}
