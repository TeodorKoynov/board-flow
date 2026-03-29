import { Hono } from "hono";
import db from "../db/connection";
import { broadcastToBoard } from "../ws/handler";

const app = new Hono();

// Update a column
app.put("/:id", async (c) => {
  const colId = c.req.param("id");
  const updates = await c.req.json();

  const column = db
    .query("SELECT * FROM columns WHERE id = ?")
    .get(colId) as any;
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    fields.push("color = ?");
    values.push(updates.color);
  }

  if (fields.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  values.push(colId);
  db.query(`UPDATE columns SET ${fields.join(", ")} WHERE id = ?`).run(
    ...values
  );

  const updated = db.query("SELECT * FROM columns WHERE id = ?").get(colId);
  return c.json(updated);
});

// Delete a column
app.delete("/:id", (c) => {
  const colId = c.req.param("id");

  const column = db
    .query("SELECT * FROM columns WHERE id = ?")
    .get(colId) as any;
  if (!column) {
    return c.json({ error: "Column not found" }, 404);
  }

  // Check if column has cards
  const cardCount = db
    .query("SELECT COUNT(*) as count FROM cards WHERE column_id = ?")
    .get(colId) as { count: number };
  if (cardCount.count > 0) {
    return c.json(
      { error: "Cannot delete column with cards. Move or delete cards first." },
      400
    );
  }

  db.query("DELETE FROM columns WHERE id = ?").run(colId);

  broadcastToBoard(column.board_id, {
    type: "column_deleted",
    columnId: colId,
  });

  return c.json({ success: true });
});

export default app;
