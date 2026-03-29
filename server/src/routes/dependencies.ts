import { Hono } from "hono";
import db from "../db/connection";
import { wouldCreateCycle } from "../services/dependency";

const app = new Hono();

// Get dependencies for a card
app.get("/cards/:cardId/dependencies", (c) => {
  const cardId = c.req.param("cardId");

  const card = db.query("SELECT * FROM cards WHERE id = ?").get(cardId) as any;
  if (!card) {
    return c.json({ error: "Card not found" }, 404);
  }

  const blockers = db
    .query(
      `SELECT d.id as dependency_id, d.blocker_card_id, c.title, c.column_id
       FROM dependencies d
       JOIN cards c ON d.blocker_card_id = c.id
       WHERE d.blocked_card_id = ?`
    )
    .all(cardId);

  const blocking = db
    .query(
      `SELECT d.id as dependency_id, d.blocked_card_id, c.title, c.column_id
       FROM dependencies d
       JOIN cards c ON d.blocked_card_id = c.id
       WHERE d.blocker_card_id = ?`
    )
    .all(cardId);

  return c.json({ blockers, blocking });
});

// Create a dependency
app.post("/dependencies", async (c) => {
  const { blockerCardId, blockedCardId } = await c.req.json();

  if (!blockerCardId || !blockedCardId) {
    return c.json(
      { error: "blockerCardId and blockedCardId are required" },
      400
    );
  }

  if (blockerCardId === blockedCardId) {
    return c.json({ error: "A card cannot block itself" }, 400);
  }

  // Verify both cards exist
  const blocker = db
    .query("SELECT * FROM cards WHERE id = ?")
    .get(blockerCardId) as any;
  const blocked = db
    .query("SELECT * FROM cards WHERE id = ?")
    .get(blockedCardId) as any;

  if (!blocker || !blocked) {
    return c.json({ error: "One or both cards not found" }, 404);
  }

  // Check for existing dependency
  const existing = db
    .query(
      "SELECT * FROM dependencies WHERE blocker_card_id = ? AND blocked_card_id = ?"
    )
    .get(blockerCardId, blockedCardId);
  if (existing) {
    return c.json({ error: "Dependency already exists" }, 409);
  }

  // Check for cycles
  const allDeps = db.query("SELECT * FROM dependencies").all() as Array<{
    id: string;
    blocker_card_id: string;
    blocked_card_id: string;
  }>;

  if (wouldCreateCycle(blockerCardId, blockedCardId, allDeps)) {
    return c.json(
      { error: "Adding this dependency would create a circular reference" },
      400
    );
  }

  const depId = crypto.randomUUID();
  db.query(
    "INSERT INTO dependencies (id, blocker_card_id, blocked_card_id) VALUES (?, ?, ?)"
  ).run(depId, blockerCardId, blockedCardId);

  const dep = db.query("SELECT * FROM dependencies WHERE id = ?").get(depId);
  return c.json(dep, 201);
});

// Delete a dependency
app.delete("/dependencies/:id", (c) => {
  const depId = c.req.param("id");

  const dep = db
    .query("SELECT * FROM dependencies WHERE id = ?")
    .get(depId) as any;
  if (!dep) {
    return c.json({ error: "Dependency not found" }, 404);
  }

  db.query("DELETE FROM dependencies WHERE id = ?").run(depId);
  return c.json({ success: true });
});

export default app;
