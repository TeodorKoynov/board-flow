export interface Board {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: string;
  color: string;
  created_at: string;
}

export interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string;
  assignee: string | null;
  labels: string; // JSON string array
  position: string;
  created_at: string;
  updated_at: string;
}

export interface Dependency {
  id: string;
  blocker_card_id: string;
  blocked_card_id: string;
  created_at: string;
}

export interface CardBlocker {
  dependency_id: string;
  blocker_card_id: string;
  title: string;
  column_id: string;
}

export interface CardBlocking {
  dependency_id: string;
  blocked_card_id: string;
  title: string;
  column_id: string;
}

export type RootStackParamList = {
  BoardList: undefined;
  Board: { boardId: string; boardName: string };
  CardDetail: { cardId: string; boardId: string };
};
