import { create } from "zustand";
import { api } from "../api/client";
import type { Board, Card, Column, Dependency } from "../types";
import { sortByPosition } from "../utils/position";

interface BoardState {
  boards: Board[];
  loadingBoards: boolean;

  currentBoardId: string | null;
  columns: Column[];
  cards: Card[];
  dependencies: Dependency[];
  loadingBoard: boolean;

  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  createBoard: (name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  createColumn: (boardId: string, name: string) => Promise<void>;

  createCard: (
    columnId: string,
    title: string,
    description?: string
  ) => Promise<void>;
  updateCard: (
    cardId: string,
    updates: Partial<Pick<Card, "title" | "description" | "assignee">>
  ) => Promise<void>;
  moveCard: (
    cardId: string,
    toColumnId: string,
    position: string
  ) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;

  addDependency: (
    blockerCardId: string,
    blockedCardId: string
  ) => Promise<void>;
  removeDependency: (dependencyId: string) => Promise<void>;

  // WebSocket sync actions
  wsCardMoved: (cardId: string, columnId: string, position: string) => void;
  wsCardUpdated: (card: Card) => void;
  wsCardCreated: (card: Card) => void;
  wsCardDeleted: (cardId: string) => void;
  wsColumnCreated: (column: Column) => void;
  wsColumnDeleted: (columnId: string) => void;

  getCardsForColumn: (columnId: string) => Card[];
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  loadingBoards: false,

  currentBoardId: null,
  columns: [],
  cards: [],
  dependencies: [],
  loadingBoard: false,

  fetchBoards: async () => {
    set({ loadingBoards: true });
    try {
      const boards = await api.boards.list();
      set({ boards, loadingBoards: false });
    } catch (err) {
      console.error("Failed to fetch boards:", err);
      set({ loadingBoards: false });
    }
  },

  fetchBoard: async (boardId: string) => {
    set({ loadingBoard: true, currentBoardId: boardId });
    try {
      const data = await api.boards.get(boardId);
      set({
        columns: sortByPosition(data.columns),
        cards: data.cards,
        dependencies: data.dependencies,
        loadingBoard: false,
      });
    } catch (err) {
      console.error("Failed to fetch board:", err);
      set({ loadingBoard: false });
    }
  },

  createBoard: async (name: string) => {
    await api.boards.create(name);
    await get().fetchBoards();
  },

  deleteBoard: async (id: string) => {
    await api.boards.delete(id);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
    }));
  },

  createColumn: async (boardId: string, name: string) => {
    const column = await api.columns.create(boardId, name);
    set((state) => ({
      columns: [...state.columns, column],
    }));
  },

  createCard: async (columnId: string, title: string, description?: string) => {
    const card = await api.cards.create(columnId, { title, description });
    set((state) => ({
      cards: [...state.cards, card],
    }));
  },

  updateCard: async (cardId: string, updates) => {
    const card = await api.cards.update(cardId, updates);
    set((state) => ({
      cards: state.cards.map((c) => (c.id === cardId ? card : c)),
    }));
  },

  moveCard: async (cardId: string, toColumnId: string, position: string) => {
    // Optimistic update
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, column_id: toColumnId, position } : c
      ),
    }));

    try {
      await api.cards.move(cardId, toColumnId, position);
    } catch (err) {
      // Revert on failure — refetch the board
      console.error("Failed to move card:", err);
      const boardId = get().currentBoardId;
      if (boardId) await get().fetchBoard(boardId);
    }
  },

  deleteCard: async (cardId: string) => {
    await api.cards.delete(cardId);
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== cardId),
      dependencies: state.dependencies.filter(
        (d) =>
          d.blocker_card_id !== cardId && d.blocked_card_id !== cardId
      ),
    }));
  },

  addDependency: async (blockerCardId: string, blockedCardId: string) => {
    const dep = await api.dependencies.create(blockerCardId, blockedCardId);
    set((state) => ({
      dependencies: [...state.dependencies, dep],
    }));
  },

  removeDependency: async (dependencyId: string) => {
    await api.dependencies.delete(dependencyId);
    set((state) => ({
      dependencies: state.dependencies.filter((d) => d.id !== dependencyId),
    }));
  },

  // WebSocket sync actions
  wsCardMoved: (cardId, columnId, position) => {
    set((state) => ({
      cards: state.cards.map((c) =>
        c.id === cardId ? { ...c, column_id: columnId, position } : c
      ),
    }));
  },

  wsCardUpdated: (card) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === card.id ? card : c)),
    }));
  },

  wsCardCreated: (card) => {
    set((state) => {
      if (state.cards.some((c) => c.id === card.id)) return state;
      return { cards: [...state.cards, card] };
    });
  },

  wsCardDeleted: (cardId) => {
    set((state) => ({
      cards: state.cards.filter((c) => c.id !== cardId),
    }));
  },

  wsColumnCreated: (column) => {
    set((state) => {
      if (state.columns.some((c) => c.id === column.id)) return state;
      return { columns: sortByPosition([...state.columns, column]) };
    });
  },

  wsColumnDeleted: (columnId) => {
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== columnId),
      cards: state.cards.filter((c) => c.column_id !== columnId),
    }));
  },

  getCardsForColumn: (columnId: string) => {
    return sortByPosition(
      get().cards.filter((c) => c.column_id === columnId)
    );
  },
}));
