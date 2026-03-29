import { Hono } from "hono";
import db from "../db/connection";
import { generatePosition } from "../services/position";
import { broadcastToBoard } from "../ws/handler";

const app = new Hono();

// List all boards
app.get("/", (c) => {
  const boards = db.query("SELECT * FROM boards ORDER BY created_at DESC").all();
  return c.json(boards);
});

// Get a board with its columns, cards, and dependencies
app.get("/:id", (c) => {
  const boardId = c.req.param("id");

  const board = db
    .query("SELECT * FROM boards WHERE id = ?")
    .get(boardId) as any;
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }

  const columns = db
    .query(
      "SELECT * FROM columns WHERE board_id = ? ORDER BY CAST(position AS REAL)"
    )
    .all(boardId);

  const cards = db
    .query(
      `SELECT c.* FROM cards c
       JOIN columns col ON c.column_id = col.id
       WHERE col.board_id = ?
       ORDER BY CAST(c.position AS REAL)`
    )
    .all(boardId);

  const dependencies = db
    .query(
      `SELECT d.* FROM dependencies d
       JOIN cards c ON d.blocker_card_id = c.id
       JOIN columns col ON c.column_id = col.id
       WHERE col.board_id = ?`
    )
    .all(boardId);

  return c.json({ board, columns, cards, dependencies });
});

// Create a board with default columns
app.post("/", async (c) => {
  const { name } = await c.req.json();
  if (!name || typeof name !== "string") {
    return c.json({ error: "Name is required" }, 400);
  }

  const boardId = crypto.randomUUID();
  db.query("INSERT INTO boards (id, name) VALUES (?, ?)").run(boardId, name);

  const defaultColumns = [
    { name: "To Do", color: "#3B82F6" },
    { name: "In Progress", color: "#F59E0B" },
    { name: "Done", color: "#10B981" },
  ];

  const positions = ["1000", "2000", "3000"];
  for (let i = 0; i < defaultColumns.length; i++) {
    const colId = crypto.randomUUID();
    db.query(
      "INSERT INTO columns (id, board_id, name, position, color) VALUES (?, ?, ?, ?, ?)"
    ).run(colId, boardId, defaultColumns[i].name, positions[i], defaultColumns[i].color);
  }

  const board = db.query("SELECT * FROM boards WHERE id = ?").get(boardId);
  return c.json(board, 201);
});

// Delete a board
app.delete("/:id", (c) => {
  const boardId = c.req.param("id");
  const board = db
    .query("SELECT * FROM boards WHERE id = ?")
    .get(boardId) as any;
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }

  db.query("DELETE FROM boards WHERE id = ?").run(boardId);
  return c.json({ success: true });
});

// Create a column in a board
app.post("/:id/columns", async (c) => {
  const boardId = c.req.param("id");
  const { name, color } = await c.req.json();

  if (!name || typeof name !== "string") {
    return c.json({ error: "Name is required" }, 400);
  }

  const board = db
    .query("SELECT * FROM boards WHERE id = ?")
    .get(boardId) as any;
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }

  // Get the last column's position to place new column after it
  const lastColumn = db
    .query(
      "SELECT position FROM columns WHERE board_id = ? ORDER BY CAST(position AS REAL) DESC LIMIT 1"
    )
    .get(boardId) as any;

  const position = lastColumn
    ? generatePosition(lastColumn.position, null)
    : "1000";

  const colId = crypto.randomUUID();
  db.query(
    "INSERT INTO columns (id, board_id, name, position, color) VALUES (?, ?, ?, ?, ?)"
  ).run(colId, boardId, name, position, color || "#6B7280");

  const column = db.query("SELECT * FROM columns WHERE id = ?").get(colId);

  broadcastToBoard(boardId, { type: "column_created", column });

  return c.json(column, 201);
});

export default app;
