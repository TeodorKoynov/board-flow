export interface WsData {
  boardId: string | null;
  userId: string;
}

// Client → Server
export type ClientMessage =
  | { type: "join_board"; boardId: string }
  | { type: "leave_board" };

// Server → Client
export type ServerMessage =
  | { type: "card_moved"; card: any; fromColumnId: string; toColumnId: string }
  | { type: "card_updated"; card: any }
  | { type: "card_created"; card: any }
  | { type: "card_deleted"; cardId: string }
  | { type: "column_created"; column: any }
  | { type: "column_deleted"; columnId: string }
  | { type: "error"; message: string };
