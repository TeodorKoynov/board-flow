import { useEffect, useRef, useState } from "react";
import { useBoardStore } from "../store/boardStore";
import { WS_BASE } from "../api/client";

/**
 * WebSocket sync hook for real-time board updates.
 */
export function useBoardSync(boardId: string | null) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const {
    wsCardMoved,
    wsCardUpdated,
    wsCardCreated,
    wsCardDeleted,
    wsColumnCreated,
    wsColumnDeleted,
  } = useBoardStore();

  useEffect(() => {
    if (!boardId) return;

    const connect = () => {
      try {
        const ws = new WebSocket(`${WS_BASE}?boardId=${boardId}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          ws.send(JSON.stringify({ type: "join_board", boardId }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case "card_moved":
                wsCardMoved(
                  msg.card.id,
                  msg.card.column_id,
                  msg.card.position
                );
                break;
              case "card_updated":
                wsCardUpdated(msg.card);
                break;
              case "card_created":
                wsCardCreated(msg.card);
                break;
              case "card_deleted":
                wsCardDeleted(msg.cardId);
                break;
              case "column_created":
                wsColumnCreated(msg.column);
                break;
              case "column_deleted":
                wsColumnDeleted(msg.columnId);
                break;
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          setConnected(false);
          wsRef.current = null;
          retryRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error("Board sync connection error:", err);
        retryRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(retryRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [boardId]);

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { connected, send };
}
