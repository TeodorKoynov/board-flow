import { Platform } from "react-native";
import Constants from "expo-constants";
import type { Board, Card, Column, Dependency, CardBlocker, CardBlocking } from "../types";

const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "3000";

function getHost(): string {
  if (process.env.EXPO_PUBLIC_API_HOST) {
    return process.env.EXPO_PUBLIC_API_HOST;
  }
  const debuggerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (debuggerHost) return debuggerHost;
  if (Platform.OS === "android") return "10.0.2.2";
  return "localhost";
}

const HOST = getHost();
export const API_BASE = `http://${HOST}:${API_PORT}/api`;
export const WS_BASE = `ws://${HOST}:${API_PORT}/ws`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  boards: {
    list: () => request<Board[]>("/boards"),
    get: (id: string) =>
      request<{
        board: Board;
        columns: Column[];
        cards: Card[];
        dependencies: Dependency[];
      }>(`/boards/${id}`),
    create: (name: string) =>
      request<Board>("/boards", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    delete: (id: string) =>
      request(`/boards/${id}`, { method: "DELETE" }),
  },

  columns: {
    create: (boardId: string, name: string, color?: string) =>
      request<Column>(`/boards/${boardId}/columns`, {
        method: "POST",
        body: JSON.stringify({ name, color }),
      }),
    update: (id: string, updates: { name?: string; color?: string }) =>
      request<Column>(`/columns/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request(`/columns/${id}`, { method: "DELETE" }),
  },

  cards: {
    create: (
      columnId: string,
      data: { title: string; description?: string; assignee?: string; labels?: string[] }
    ) =>
      request<Card>(`/columns/${columnId}/cards`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      updates: Partial<Pick<Card, "title" | "description" | "assignee">> & {
        labels?: string[];
      }
    ) =>
      request<Card>(`/cards/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    move: (id: string, columnId: string, position: string) =>
      request<Card>(`/cards/${id}/move`, {
        method: "PUT",
        body: JSON.stringify({ columnId, position }),
      }),
    delete: (id: string) =>
      request(`/cards/${id}`, { method: "DELETE" }),
  },

  dependencies: {
    get: (cardId: string) =>
      request<{ blockers: CardBlocker[]; blocking: CardBlocking[] }>(
        `/cards/${cardId}/dependencies`
      ),
    create: (blockerCardId: string, blockedCardId: string) =>
      request<Dependency>("/dependencies", {
        method: "POST",
        body: JSON.stringify({ blockerCardId, blockedCardId }),
      }),
    delete: (id: string) =>
      request(`/dependencies/${id}`, { method: "DELETE" }),
  },
};
