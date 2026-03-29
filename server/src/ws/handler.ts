import type { Server, ServerWebSocket } from "bun";
import type { WsData, ClientMessage } from "./types";

let serverInstance: Server;

export function setServer(server: Server) {
  serverInstance = server;
}

export function broadcastToBoard(boardId: string, message: any) {
  if (serverInstance) {
    serverInstance.publish(`board:${boardId}`, JSON.stringify(message));
  }
}

export const wsHandler = {
  open(ws: ServerWebSocket<WsData>) {
    if (ws.data.boardId) {
      ws.subscribe(`board:${ws.data.boardId}`);
    }
    console.log(`WebSocket connected: ${ws.data.userId}`);
  },

  message(ws: ServerWebSocket<WsData>, message: string | Buffer) {
    try {
      const msg: ClientMessage = JSON.parse(String(message));

      switch (msg.type) {
        case "join_board": {
          if (ws.data.boardId) {
            ws.unsubscribe(`board:${ws.data.boardId}`);
          }
          ws.data.boardId = msg.boardId;
          ws.subscribe(`board:${msg.boardId}`);
          console.log(
            `User ${ws.data.userId} joined board ${msg.boardId}`
          );
          break;
        }

        case "leave_board": {
          if (ws.data.boardId) {
            ws.unsubscribe(`board:${ws.data.boardId}`);
            console.log(
              `User ${ws.data.userId} left board ${ws.data.boardId}`
            );
            ws.data.boardId = null;
          }
          break;
        }
      }
    } catch (err) {
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
    }
  },

  close(ws: ServerWebSocket<WsData>) {
    if (ws.data.boardId) {
      ws.unsubscribe(`board:${ws.data.boardId}`);
    }
    console.log(`WebSocket disconnected: ${ws.data.userId}`);
  },
};
