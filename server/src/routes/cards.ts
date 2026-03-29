import { Hono } from "hono";
import db from "../db/connection";
import { generatePosition } from "../services/position";
import { broadcastToBoard } from "../ws/handler";

interface DbCard {
  id: string;
  column_id: string;
  title: string;
  description: string;
  assignee: string | null;
  labels: string;
  position: string;
  created_at: string;
  updated_at: string;
}

interface DbColumn {
  id: string;
  board_id: string;
  name: string;
  position: string;
  color: string;
  created_at: string;
}

const app = new Hono();

// Create a card in a column
app.post("/columns/:columnId/cards", async (c) => {
  const columnId = c.req.param("columnId");
  const { title, description, assignee, labels } = await c.req.json();

  if (!title || typeof title !== "string") {
    return c.json({ error: "Title is required" }, 400);
  }

  const column = db
    .query("SELECT * FROM columns WHERE id = ?")
    .get(columnId) as DbColumn | null;
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }

  // Get the last card's position in this column
  const lastCard = db
    .query(
      "SELECT position FROM cards WHERE column_id = ? ORDER BY CAST(position AS REAL) DESC LIMIT 1"
    )
    .get(columnId) as { position: string } | null;

  const position = lastCard
    ? generatePosition(lastCard.position, null)
    : "1000";

  const cardId = crypto.randomUUID();
  db.query(
    "INSERT INTO cards (id, column_id, title, description, assignee, labels, position) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    cardId,
    columnId,
    title,
    description || "",
    assignee || null,
    JSON.stringify(labels || []),
    position
  );

  const card = db.query("SELECT * FROM cards WHERE id = ?").get(cardId);

  broadcastToBoard(column.board_id, {
    type: "card_created",
    card,
  });

  return c.json(card, 201);
});

// Update a card
app.put("/cards/:id", async (c) => {
  const cardId = c.req.param("id");
  const updates = await c.req.json();

  const card = db
    .query("SELECT * FROM cards WHERE id = ?")
    .get(cardId) as DbCard | null;
  if (!card) {
    return c.json({ error: "Card not found" }, 404);
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push("description = ?");
    values.push(updates.description);
  }
  if (updates.assignee !== undefined) {
    fields.push("assignee = ?");
    values.push(updates.assignee);
  }
  if (updates.labels !== undefined) {
    fields.push("labels = ?");
    values.push(JSON.stringify(updates.labels));
  }

  if (fields.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  fields.push('updated_at = datetime("now")');
  values.push(cardId);

  db.query(`UPDATE cards SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db.query("SELECT * FROM cards WHERE id = ?").get(cardId);

  // Get board ID for broadcast
  const column = db
    .query("SELECT board_id FROM columns WHERE id = ?")
    .get(card.column_id) as { board_id: string };

  broadcastToBoard(column.board_id, {
    type: "card_updated",
    card: updated,
  });

  return c.json(updated);
});

// Move a card to a different column and/or position
app.put("/cards/:id/move", async (c) => {
  const cardId = c.req.param("id");
  const { columnId, position } = await c.req.json();

  if (!columnId || !position) {
    return c.json({ error: "columnId and position are required" }, 400);
  }

  // Read current card state
  const card = db
    .query("SELECT * FROM cards WHERE id = ?")
    .get(cardId) as DbCard | null;
  if (!card) {
    return c.json({ error: "Card not found" }, 404);
  }

  // Verify target column exists
  const column = db
    .query("SELECT * FROM columns WHERE id = ?")
    .get(columnId) as DbColumn | null;
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }

  db.query(
    'UPDATE cards SET column_id = ?, position = ?, updated_at = datetime("now") WHERE id = ?'
  ).run(columnId, position, cardId);

  const updatedCard = db
    .query("SELECT * FROM cards WHERE id = ?")
    .get(cardId);

  broadcastToBoard(column.board_id, {
    type: "card_moved",
    card: updatedCard,
    fromColumnId: card.column_id,
    toColumnId: columnId,
  });

  return c.json(updatedCard);
});

// Delete a card
app.delete("/cards/:id", (c) => {
  const cardId = c.req.param("id");

  const card = db
    .query("SELECT * FROM cards WHERE id = ?")
    .get(cardId) as DbCard | null;
  if (!card) {
    return c.json({ error: "Card not found" }, 404);
  }

  const column = db
    .query("SELECT board_id FROM columns WHERE id = ?")
    .get(card.column_id) as { board_id: string };

  db.query("DELETE FROM cards WHERE id = ?").run(cardId);

  broadcastToBoard(column.board_id, {
    type: "card_deleted",
    cardId,
  });

  return c.json({ success: true });
});

export default app;
