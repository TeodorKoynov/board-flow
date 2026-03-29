import db from "./connection";

export function seedDatabase() {
  const result = db.query("SELECT COUNT(*) as count FROM boards").get() as {
    count: number;
  };
  if (result.count > 0) return;

  const boardId = crypto.randomUUID();
  db.query("INSERT INTO boards (id, name) VALUES (?, ?)").run(
    boardId,
    "Project Alpha"
  );

  const columns = [
    {
      id: crypto.randomUUID(),
      name: "Backlog",
      position: "1000",
      color: "#6B7280",
    },
    {
      id: crypto.randomUUID(),
      name: "To Do",
      position: "2000",
      color: "#3B82F6",
    },
    {
      id: crypto.randomUUID(),
      name: "In Progress",
      position: "3000",
      color: "#F59E0B",
    },
    {
      id: crypto.randomUUID(),
      name: "Done",
      position: "4000",
      color: "#10B981",
    },
  ];

  const insertColumn = db.query(
    "INSERT INTO columns (id, board_id, name, position, color) VALUES (?, ?, ?, ?, ?)"
  );
  for (const col of columns) {
    insertColumn.run(col.id, boardId, col.name, col.position, col.color);
  }

  const cardData = [
    {
      title: "Set up project structure",
      description:
        "Initialize the monorepo with server and mobile packages. Configure TypeScript, linting, and build tools.",
      colIdx: 3,
      position: "1000",
      assignee: "Alice",
    },
    {
      title: "Design database schema",
      description:
        "Define tables for boards, columns, cards, and dependencies. Set up migrations.",
      colIdx: 3,
      position: "2000",
      assignee: "Alice",
    },
    {
      title: "Implement REST API",
      description:
        "Build CRUD endpoints for boards, columns, and cards using Hono framework.",
      colIdx: 2,
      position: "1000",
      assignee: "Bob",
    },
    {
      title: "Build WebSocket server",
      description:
        "Add real-time sync support. Handle board subscriptions and broadcast card changes.",
      colIdx: 2,
      position: "2000",
      assignee: "Bob",
    },
    {
      title: "Create board list screen",
      description:
        "Mobile screen showing all boards with create/delete functionality.",
      colIdx: 1,
      position: "1000",
      assignee: "Charlie",
    },
    {
      title: "Create kanban board view",
      description:
        "Horizontal scrolling columns with card lists. Support card movement between columns.",
      colIdx: 1,
      position: "2000",
      assignee: "Charlie",
    },
    {
      title: "Add card filtering",
      description:
        "Filter cards by assignee, labels, or blocked status within a board.",
      colIdx: 0,
      position: "1000",
      assignee: null,
    },
    {
      title: "Implement offline support",
      description:
        "Queue operations locally when offline and sync when connection is restored.",
      colIdx: 0,
      position: "2000",
      assignee: null,
    },
    {
      title: "Add automation rules engine",
      description:
        "Allow users to create rules that trigger actions when cards are moved or updated.",
      colIdx: 0,
      position: "3000",
      assignee: null,
    },
    {
      title: "Performance optimization",
      description:
        "Optimize rendering for boards with 100+ cards. Virtual lists, memoization.",
      colIdx: 0,
      position: "4000",
      assignee: null,
    },
  ];

  const insertCard = db.query(
    "INSERT INTO cards (id, column_id, title, description, position, assignee) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const cardIds: string[] = [];
  for (const card of cardData) {
    const cardId = crypto.randomUUID();
    cardIds.push(cardId);
    insertCard.run(
      cardId,
      columns[card.colIdx].id,
      card.title,
      card.description,
      card.position,
      card.assignee
    );
  }

  const insertDep = db.query(
    "INSERT INTO dependencies (id, blocker_card_id, blocked_card_id) VALUES (?, ?, ?)"
  );
  // "Implement REST API" blocked by "Design database schema"
  insertDep.run(crypto.randomUUID(), cardIds[1], cardIds[2]);
  // "Build WebSocket server" blocked by "Implement REST API"
  insertDep.run(crypto.randomUUID(), cardIds[2], cardIds[3]);
  // "Create kanban board view" blocked by "Create board list screen"
  insertDep.run(crypto.randomUUID(), cardIds[4], cardIds[5]);

  console.log("Database seeded with sample data");
}
