interface Dependency {
  id: string;
  blocker_card_id: string;
  blocked_card_id: string;
}

/**
 * Checks if adding a dependency from blockerId to blockedId would create a cycle.
 * Returns true if the dependency would create a circular reference.
 */
export function wouldCreateCycle(
  blockerId: string,
  blockedId: string,
  existingDeps: Dependency[]
): boolean {
  return existingDeps.some(
    (dep) =>
      dep.blocker_card_id === blockedId && dep.blocked_card_id === blockerId
  );
}

/**
 * Gets all cards that are blocking a given card.
 */
export function getBlockers(cardId: string, dependencies: Dependency[]) {
  return dependencies.filter((d) => d.blocked_card_id === cardId);
}

/**
 * Gets all cards that a given card is blocking.
 */
export function getBlocking(cardId: string, dependencies: Dependency[]) {
  return dependencies.filter((d) => d.blocker_card_id === cardId);
}

/**
 * Determines if a card is currently blocked (has any blockers).
 */
export function isCardBlocked(
  cardId: string,
  dependencies: Dependency[]
): boolean {
  return dependencies.some((d) => d.blocked_card_id === cardId);
}
